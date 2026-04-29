import { type Plugin, tool } from "@opencode-ai/plugin"
import { mkdir, readFile, writeFile, readdir, stat } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join } from "node:path"
import {
  ARTIFACT_ROOT,
  type DeleteResult,
  deleteFile,
  formatErr,
  makeResolveProject,
  removeEmptyDir,
} from "./lib/project"

const DEFAULT_TTL_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

const artifactPathFor = (project: string, command: string): string =>
  join(ARTIFACT_ROOT, project, `${command}.md`)

const resolveTtlDays = (): number => {
  const raw = process.env.OPENCODE_ARTIFACT_TTL_DAYS
  if (raw === undefined || raw === "") return DEFAULT_TTL_DAYS
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_TTL_DAYS
  return parsed
}

const collectProjects = async (): Promise<string[]> => {
  if (!existsSync(ARTIFACT_ROOT)) return []
  const entries = await readdir(ARTIFACT_ROOT, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

const collectArtifacts = async (project: string): Promise<string[]> => {
  const dir = join(ARTIFACT_ROOT, project)
  if (!existsSync(dir)) return []
  const entries = await readdir(dir)
  return entries.filter((e) => e.endsWith(".md")).map((e) => join(dir, e))
}

const pruneExpired = async (ttlDays: number): Promise<DeleteResult> => {
  const result: DeleteResult = { deleted: [], skipped: [] }
  if (ttlDays <= 0) return result
  const cutoff = Date.now() - ttlDays * DAY_MS
  const projects = await collectProjects()
  for (const project of projects) {
    const files = await collectArtifacts(project)
    for (const path of files) {
      try {
        const s = await stat(path)
        if (s.mtimeMs < cutoff) await deleteFile(path, result)
      } catch {
        result.skipped.push(path)
      }
    }
    await removeEmptyDir(join(ARTIFACT_ROOT, project))
  }
  return result
}

export const ArtifactsPlugin: Plugin = async ({ $, client, project }) => {
  const resolveProject = makeResolveProject({ $, project })

  const ensureProjectDir = async (project: string): Promise<string> => {
    const dir = join(ARTIFACT_ROOT, project)
    await mkdir(dir, { recursive: true })
    return dir
  }

  await mkdir(ARTIFACT_ROOT, { recursive: true })

  const logErr = async (where: string, err: unknown): Promise<void> => {
    try {
      await client.app.log({
        body: { service: "plugin/artifacts", level: "error", message: `${where}: ${formatErr(err)}` },
      })
    } catch {
      console.error(`[plugin/artifacts] ${where}:`, err)
    }
  }

  // Fire-and-forget startup TTL prune. Errors during cleanup must not block plugin init.
  // Without the .catch, prune failures would be silent unhandled rejections — making it
  // impossible to diagnose if pruning is implicated in startup hangs.
  const ttlDays = resolveTtlDays()
  void pruneExpired(ttlDays)
    .then(async (result) => {
      if (result.deleted.length > 0) {
        await client.app.log({
          body: {
            service: "plugin/artifacts",
            level: "info",
            message: `pruned ${result.deleted.length} artifact(s) older than ${ttlDays} days from ~/.opencode-data/artifacts/`,
          },
        })
      }
    })
    .catch((err) => logErr("startup TTL prune failed", err))

  return {
    "shell.env": async (_input, output) => {
      try {
        const project = await resolveProject()
        const dir = await ensureProjectDir(project)
        output.env.OPENCODE_PROJECT = project
        output.env.OPENCODE_ARTIFACT_DIR = dir
      } catch (err) {
        await logErr("shell.env injection failed", err)
      }
    },

    tool: {
      artifact_read: tool({
        description:
          "Read an artifact (session handoff note). Returns file contents or a not-found message. Path: ~/.opencode-data/artifacts/<project>/<command>.md.",
        args: {
          command: tool.schema
            .string()
            .describe("Command name / file stem (e.g. 'handoff')."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to current (git remote → repo dir → cwd)."),
        },
        async execute(args) {
          try {
            const project = args.project ?? (await resolveProject())
            const path = artifactPathFor(project, args.command)
            if (!existsSync(path)) {
              return `No artifact at ${path}.`
            }
            const content = await readFile(path, "utf8")
            return `${project}/${args.command}.md:\n${content}`
          } catch (err) {
            return `artifact_read failed: ${formatErr(err)}`
          }
        },
      }),

      artifact_write: tool({
        description:
          "Write/overwrite an artifact (session handoff). One file per command per project, no history. Keep content terse — artifacts are re-read on every /catchup.",
        args: {
          command: tool.schema
            .string()
            .describe("Command name / file stem (e.g. 'handoff')."),
          content: tool.schema.string().describe("Full artifact content (markdown)."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to current."),
        },
        async execute(args) {
          try {
            const project = args.project ?? (await resolveProject())
            await ensureProjectDir(project)
            const path = artifactPathFor(project, args.command)
            await writeFile(path, args.content, "utf8")
            return `Wrote ${args.content.length} bytes to ${path}.`
          } catch (err) {
            return `artifact_write failed: ${formatErr(err)}`
          }
        },
      }),

      artifact_list: tool({
        description: "List artifacts: command | size | date.",
        args: {
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to current."),
        },
        async execute(args) {
          try {
            const project = args.project ?? (await resolveProject())
            const dir = join(ARTIFACT_ROOT, project)
            if (!existsSync(dir)) {
              return `No artifacts for '${project}'.`
            }
            const entries = await readdir(dir)
            const md = entries.filter((e) => e.endsWith(".md"))
            if (md.length === 0) {
              return `No artifacts for '${project}'.`
            }
            const rows = await Promise.all(
              md.map(async (name) => {
                const s = await stat(join(dir, name))
                return `- ${name.replace(/\.md$/, "")} ${s.size}B ${s.mtime.toISOString().slice(0, 10)}`
              }),
            )
            return `Artifacts (${project}):\n${rows.join("\n")}`
          } catch (err) {
            return `artifact_list failed: ${formatErr(err)}`
          }
        },
      }),

      artifact_delete: tool({
        description:
          "Delete artifacts. Scope by args: `command`+`project` → one file; `project` only → all artifacts in that project; `command` only → that file across every project; neither → wipe all artifacts across all projects. Operates only under `~/.opencode-data/artifacts/`; memory storage lives in a separate subtree and is unreachable from this tool. `confirm: true` required. Returns deleted/skipped paths.",
        args: {
          confirm: tool.schema
            .literal(true)
            .describe("Must be true. Guardrail."),
          command: tool.schema
            .string()
            .optional()
            .describe("Command name (file stem). Omit to scope by project or wipe all."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Omit to apply across all projects."),
        },
        async execute(args) {
          try {
            const result: DeleteResult = { deleted: [], skipped: [] }
            const projects = args.project ? [args.project] : await collectProjects()

            for (const project of projects) {
              const projectDir = join(ARTIFACT_ROOT, project)
              if (!existsSync(projectDir)) continue

              if (args.command) {
                const path = artifactPathFor(project, args.command)
                if (existsSync(path)) await deleteFile(path, result)
              } else {
                const files = await collectArtifacts(project)
                for (const path of files) await deleteFile(path, result)
              }
              await removeEmptyDir(projectDir)
            }

            const lines = [`Deleted ${result.deleted.length} artifact(s).`]
            if (result.deleted.length > 0) lines.push(...result.deleted.map((p) => `  - ${p}`))
            if (result.skipped.length > 0) {
              lines.push(`Skipped ${result.skipped.length} (could not delete):`)
              lines.push(...result.skipped.map((p) => `  - ${p}`))
            }
            return lines.join("\n")
          } catch (err) {
            return `artifact_delete failed: ${formatErr(err)}`
          }
        },
      }),
    },
  }
}

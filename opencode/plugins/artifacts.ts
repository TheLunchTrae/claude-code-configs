import { type Plugin, tool } from "@opencode-ai/plugin"
import { mkdir, readFile, writeFile, readdir, stat, unlink, rmdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { basename, join } from "node:path"

const ARTIFACT_ROOT = join(homedir(), ".opencode-artifacts")
const DEFAULT_TTL_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

const projectNameFromRemoteUrl = (url: string): string | undefined => {
  const trimmed = url.trim().replace(/\.git$/, "")
  if (!trimmed) return undefined
  const last = trimmed.split(/[\/:]/).pop()
  return last || undefined
}

const artifactPathFor = (project: string, command: string): string =>
  join(ARTIFACT_ROOT, project, `${command}.md`)

const resolveTtlDays = (): number => {
  const raw = process.env.OPENCODE_ARTIFACT_TTL_DAYS
  if (raw === undefined || raw === "") return DEFAULT_TTL_DAYS
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_TTL_DAYS
  return parsed
}

const removeEmptyDir = async (dir: string): Promise<void> => {
  try {
    await rmdir(dir)
  } catch {
    // not empty or already gone — ignore
  }
}

type DeleteResult = { deleted: string[]; skipped: string[] }

const deleteFile = async (path: string, result: DeleteResult): Promise<void> => {
  try {
    await unlink(path)
    result.deleted.push(path)
  } catch {
    result.skipped.push(path)
  }
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

export const ArtifactsPlugin: Plugin = async ({ $, directory }) => {
  let cachedProject: string | undefined

  const resolveProject = async (): Promise<string> => {
    if (cachedProject) return cachedProject
    try {
      const remote = (await $`git -C ${directory} config --get remote.origin.url`.quiet().nothrow().text()).trim()
      const fromRemote = projectNameFromRemoteUrl(remote)
      if (fromRemote) return (cachedProject = fromRemote)
    } catch {
      // fall through
    }
    try {
      const top = (await $`git -C ${directory} rev-parse --show-toplevel`.quiet().nothrow().text()).trim()
      if (top) return (cachedProject = basename(top))
    } catch {
      // fall through
    }
    return (cachedProject = basename(directory))
  }

  const ensureProjectDir = async (project: string): Promise<string> => {
    const dir = join(ARTIFACT_ROOT, project)
    await mkdir(dir, { recursive: true })
    return dir
  }

  await mkdir(ARTIFACT_ROOT, { recursive: true })

  // Fire-and-forget startup TTL prune. Errors during cleanup must not block plugin init.
  const ttlDays = resolveTtlDays()
  void pruneExpired(ttlDays).then((result) => {
    if (result.deleted.length > 0) {
      console.log(
        `[artifacts] pruned ${result.deleted.length} artifact(s) older than ${ttlDays} days from ~/.opencode-artifacts/`,
      )
    }
  })

  return {
    "shell.env": async (_input, output) => {
      const project = await resolveProject()
      const dir = await ensureProjectDir(project)
      output.env.OPENCODE_PROJECT = project
      output.env.OPENCODE_ARTIFACT_DIR = dir
    },

    tool: {
      artifact_read: tool({
        description:
          "Read an artifact written by another OpenCode session for this (or another) project. Returns the artifact contents, or a not-found message. Artifacts live at ~/.opencode-artifacts/<project>/<command>.md.",
        args: {
          command: tool.schema
            .string()
            .describe("The command name (matches the file stem, e.g. 'handoff')."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to the current project (git remote → repo dir → cwd)."),
        },
        async execute(args) {
          const project = args.project ?? (await resolveProject())
          const path = artifactPathFor(project, args.command)
          if (!existsSync(path)) {
            return `No artifact found at ${path}.`
          }
          const content = await readFile(path, "utf8")
          return `Artifact ${project}/${args.command}.md:\n\n${content}`
        },
      }),

      artifact_write: tool({
        description:
          "Write an artifact for this (or another) project, overwriting any previous content. Artifacts are single-file-per-command per-project with no history.",
        args: {
          command: tool.schema
            .string()
            .describe("The command name (used as the file stem, e.g. 'handoff')."),
          content: tool.schema.string().describe("The full artifact content to write (markdown)."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to the current project (git remote → repo dir → cwd)."),
        },
        async execute(args) {
          const project = args.project ?? (await resolveProject())
          await ensureProjectDir(project)
          const path = artifactPathFor(project, args.command)
          await writeFile(path, args.content, "utf8")
          return `Wrote ${args.content.length} bytes to ${path}.`
        },
      }),

      artifact_list: tool({
        description:
          "List artifacts for this (or another) project. Returns each artifact's command name, size, and modification time.",
        args: {
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to the current project (git remote → repo dir → cwd)."),
        },
        async execute(args) {
          const project = args.project ?? (await resolveProject())
          const dir = join(ARTIFACT_ROOT, project)
          if (!existsSync(dir)) {
            return `No artifacts directory for project '${project}' (would be at ${dir}).`
          }
          const entries = await readdir(dir)
          const md = entries.filter((e) => e.endsWith(".md"))
          if (md.length === 0) {
            return `No artifacts for project '${project}'.`
          }
          const rows = await Promise.all(
            md.map(async (name) => {
              const s = await stat(join(dir, name))
              return `- ${name.replace(/\.md$/, "")}  (${s.size}B, modified ${s.mtime.toISOString()})`
            }),
          )
          return `Artifacts for '${project}':\n${rows.join("\n")}`
        },
      }),

      artifact_delete: tool({
        description:
          "Delete artifacts. Scope is determined by which arguments are provided: both `command` and `project` deletes one file; `project` alone deletes every artifact for that project; `command` alone deletes that command's file in every project; neither deletes everything under ~/.opencode-artifacts/. `confirm: true` is required for every invocation as a guardrail against accidental wipes. Returns a summary of deleted and skipped paths.",
        args: {
          confirm: tool.schema
            .literal(true)
            .describe("Must be set to true. Required guardrail — operator must explicitly opt in to deletion."),
          command: tool.schema
            .string()
            .optional()
            .describe("Command name (file stem). Omit to scope by project or wipe everything."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Omit to apply across all projects."),
        },
        async execute(args) {
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
        },
      }),
    },
  }
}

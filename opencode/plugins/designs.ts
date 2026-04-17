// Designs plugin — long-lived architectural memory. Sibling to artifacts.ts.
//
// Storage: ~/.opencode-artifacts/<project>/designs/<topic>.md (single file per
// topic, overwritten on write). No TTL prune — designs are durable, not session
// handoffs. Pruning is manual via design_delete or /cleanup-artifacts.
//
// The following helpers are duplicated from plugins/artifacts.ts and must be
// kept in sync if edited in either file: projectNameFromRemoteUrl,
// removeEmptyDir, deleteFile, DeleteResult, and the resolveProject closure.

import { type Plugin, tool } from "@opencode-ai/plugin"
import { mkdir, readFile, writeFile, readdir, stat, unlink, rmdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { basename, join } from "node:path"

const ARTIFACT_ROOT = join(homedir(), ".opencode-artifacts")
const DESIGNS_SUBDIR = "designs"
const TOPIC_RE = /^[a-z0-9][a-z0-9-]{0,63}$/

const projectNameFromRemoteUrl = (url: string): string | undefined => {
  const trimmed = url.trim().replace(/\.git$/, "")
  if (!trimmed) return undefined
  const last = trimmed.split(/[\/:]/).pop()
  return last || undefined
}

const designsDirFor = (project: string): string =>
  join(ARTIFACT_ROOT, project, DESIGNS_SUBDIR)

const designPathFor = (project: string, topic: string): string =>
  join(designsDirFor(project), `${topic}.md`)

const normalizeTopic = (raw: string): string =>
  raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/-+/g, "-")

type TopicResult = { ok: true; topic: string } | { ok: false; error: string }

const validateTopic = (raw: string): TopicResult => {
  const topic = normalizeTopic(raw)
  if (!TOPIC_RE.test(topic)) {
    return {
      ok: false,
      error: `Invalid topic '${raw}'. Must be kebab-case ASCII matching /^[a-z0-9][a-z0-9-]{0,63}$/ after normalization (got '${topic}').`,
    }
  }
  return { ok: true, topic }
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

const collectProjectsWithDesigns = async (): Promise<string[]> => {
  if (!existsSync(ARTIFACT_ROOT)) return []
  const entries = await readdir(ARTIFACT_ROOT, { withFileTypes: true })
  const projects = entries.filter((e) => e.isDirectory()).map((e) => e.name)
  return projects.filter((p) => existsSync(designsDirFor(p)))
}

const collectDesigns = async (project: string): Promise<string[]> => {
  const dir = designsDirFor(project)
  if (!existsSync(dir)) return []
  const entries = await readdir(dir)
  return entries.filter((e) => e.endsWith(".md")).map((e) => join(dir, e))
}

export const DesignsPlugin: Plugin = async ({ $, directory }) => {
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

  const ensureDesignsDir = async (project: string): Promise<string> => {
    const dir = designsDirFor(project)
    await mkdir(dir, { recursive: true })
    return dir
  }

  await mkdir(ARTIFACT_ROOT, { recursive: true })

  return {
    "shell.env": async (_input, output) => {
      const project = await resolveProject()
      const dir = await ensureDesignsDir(project)
      output.env.OPENCODE_DESIGN_DIR = dir
    },

    tool: {
      design_read: tool({
        description:
          "Read a design record (raw markdown). Returns file contents or a not-found message. Designs are durable architectural memory with an in-file Decision log.",
        args: {
          topic: tool.schema
            .string()
            .describe("Kebab-case topic slug (e.g. 'auth-flow'). Spaces → hyphens, lowercased before validation."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to current (git remote → repo dir → cwd)."),
        },
        async execute(args) {
          const v = validateTopic(args.topic)
          if (!v.ok) return v.error
          const project = args.project ?? (await resolveProject())
          const path = designPathFor(project, v.topic)
          if (!existsSync(path)) {
            return `No design at ${path}.`
          }
          const content = await readFile(path, "utf8")
          return `${project}/designs/${v.topic}.md:\n${content}`
        },
      }),

      design_write: tool({
        description:
          "Write/overwrite a design record. CRITICAL on updates: design_read first, preserve every prior 'Decision log' entry verbatim, then append a new entry — never truncate the log (it is the only history). See instructions/designs.md for the template.",
        args: {
          topic: tool.schema
            .string()
            .describe("Kebab-case topic slug. Spaces → hyphens, lowercased before validation."),
          content: tool.schema
            .string()
            .describe("Full design document (markdown). Must include a 'Decision log' section."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to current."),
        },
        async execute(args) {
          const v = validateTopic(args.topic)
          if (!v.ok) return v.error
          const project = args.project ?? (await resolveProject())
          await ensureDesignsDir(project)
          const path = designPathFor(project, v.topic)
          await writeFile(path, args.content, "utf8")
          return `Wrote ${args.content.length} bytes to ${path}.`
        },
      }),

      design_list: tool({
        description:
          "List designs (topic | size | date). Call at the start of planning or architectural work to surface prior decisions.",
        args: {
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to current."),
        },
        async execute(args) {
          const project = args.project ?? (await resolveProject())
          const dir = designsDirFor(project)
          if (!existsSync(dir)) {
            return `No designs for '${project}'.`
          }
          const entries = await readdir(dir)
          const md = entries.filter((e) => e.endsWith(".md"))
          if (md.length === 0) {
            return `No designs for '${project}'.`
          }
          const rows = await Promise.all(
            md.map(async (name) => {
              const s = await stat(join(dir, name))
              return `- ${name.replace(/\.md$/, "")} ${s.size}B ${s.mtime.toISOString().slice(0, 10)}`
            }),
          )
          return `Designs (${project}):\n${rows.join("\n")}`
        },
      }),

      design_delete: tool({
        description:
          "Delete design records. Scoped to designs/ only — will NOT touch artifacts. Scope by args: `topic`+`project` → one file; `project` only → all designs in that project; `topic` only → that topic across every project; neither → wipe all designs. `confirm: true` required. Returns deleted/skipped paths.",
        args: {
          confirm: tool.schema
            .literal(true)
            .describe("Must be true. Guardrail."),
          topic: tool.schema
            .string()
            .optional()
            .describe("Topic slug (file stem). Omit to scope by project or wipe all."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Omit to apply across all projects."),
        },
        async execute(args) {
          let topic: string | undefined
          if (args.topic !== undefined) {
            const v = validateTopic(args.topic)
            if (!v.ok) return v.error
            topic = v.topic
          }
          const result: DeleteResult = { deleted: [], skipped: [] }
          const projects = args.project ? [args.project] : await collectProjectsWithDesigns()

          for (const project of projects) {
            const dir = designsDirFor(project)
            if (!existsSync(dir)) continue

            if (topic) {
              const path = designPathFor(project, topic)
              if (existsSync(path)) await deleteFile(path, result)
            } else {
              const files = await collectDesigns(project)
              for (const path of files) await deleteFile(path, result)
            }
            await removeEmptyDir(dir)
            await removeEmptyDir(join(ARTIFACT_ROOT, project))
          }

          const lines = [`Deleted ${result.deleted.length} design(s).`]
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

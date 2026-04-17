// Memory plugin — unified store for loose facts and instinct-style behavioral
// rules. Sibling to artifacts.ts.
//
// Storage: ~/.opencode-artifacts/<project>/memory/<slug>.yaml — one compact
// YAML file per entry. Durable (no TTL). Entries hold a short `note` plus
// optional `domain`, `trigger`, `confidence`, and `source`. Presence of
// `trigger` promotes an entry from plain memory to an instinct.
//
// Token cost is paid on every session that calls memory_list, so entries are
// kept terse by design: flat YAML with always-quoted string values (no parser
// library needed) and a truncated table on list.
//
// The following helpers are duplicated from plugins/artifacts.ts and must be
// kept in sync if edited in either of them: projectNameFromRemoteUrl,
// removeEmptyDir, deleteFile, DeleteResult, and the resolveProject closure.

import { type Plugin, tool } from "@opencode-ai/plugin"
import { mkdir, readFile, writeFile, readdir, unlink, rmdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { basename, join } from "node:path"

const ARTIFACT_ROOT = join(homedir(), ".opencode-artifacts")
const MEMORY_SUBDIR = "memory"
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/

const projectNameFromRemoteUrl = (url: string): string | undefined => {
  const trimmed = url.trim().replace(/\.git$/, "")
  if (!trimmed) return undefined
  const last = trimmed.split(/[\/:]/).pop()
  return last || undefined
}

const memoryDirFor = (project: string): string =>
  join(ARTIFACT_ROOT, project, MEMORY_SUBDIR)

const memoryPathFor = (project: string, slug: string): string =>
  join(memoryDirFor(project), `${slug}.yaml`)

const normalizeSlug = (raw: string): string =>
  raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/-+/g, "-")

type SlugResult = { ok: true; slug: string } | { ok: false; error: string }

const validateSlug = (raw: string): SlugResult => {
  const slug = normalizeSlug(raw)
  if (!SLUG_RE.test(slug)) {
    return {
      ok: false,
      error: `Invalid slug '${raw}'. Must be kebab-case ASCII matching /^[a-z0-9][a-z0-9-]{0,63}$/ after normalization (got '${slug}').`,
    }
  }
  return { ok: true, slug }
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

const collectProjectsWithMemory = async (): Promise<string[]> => {
  if (!existsSync(ARTIFACT_ROOT)) return []
  const entries = await readdir(ARTIFACT_ROOT, { withFileTypes: true })
  const projects = entries.filter((e) => e.isDirectory()).map((e) => e.name)
  return projects.filter((p) => existsSync(memoryDirFor(p)))
}

const collectMemories = async (project: string): Promise<string[]> => {
  const dir = memoryDirFor(project)
  if (!existsSync(dir)) return []
  const entries = await readdir(dir)
  return entries.filter((e) => e.endsWith(".yaml")).map((e) => join(dir, e))
}

// Always single-quote string values; embedded single quotes doubled per YAML 1.2.
// Predictable parse, no dependency on quote-detection heuristics.
const yamlQuote = (value: string): string => `'${value.replace(/'/g, "''")}'`

type Entry = {
  note: string
  domain?: string
  trigger?: string
  confidence?: number
  source?: string
}

const serializeEntry = (entry: Entry): string => {
  const lines: string[] = []
  if (entry.domain !== undefined) lines.push(`domain: ${yamlQuote(entry.domain)}`)
  if (entry.trigger !== undefined) lines.push(`trigger: ${yamlQuote(entry.trigger)}`)
  if (entry.confidence !== undefined) lines.push(`confidence: ${entry.confidence}`)
  if (entry.source !== undefined) lines.push(`source: ${yamlQuote(entry.source)}`)
  lines.push(`note: ${yamlQuote(entry.note)}`)
  return lines.join("\n") + "\n"
}

// Cheap line parser used only to surface fields for memory_list and to match
// domains in memory_delete. The LLM reads raw file contents on memory_read, so
// full YAML parsing would be wasted code.
const parseEntryFields = (raw: string): Partial<Entry> => {
  const out: Partial<Entry> = {}
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^(\w+):\s*(.*)$/)
    if (!match) continue
    const key = match[1]
    let value = match[2].trim()
    if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
      value = value.slice(1, -1).replace(/''/g, "'")
    }
    switch (key) {
      case "note":
        out.note = value
        break
      case "domain":
        out.domain = value
        break
      case "trigger":
        out.trigger = value
        break
      case "source":
        out.source = value
        break
      case "confidence": {
        const n = Number(value)
        if (Number.isFinite(n)) out.confidence = n
        break
      }
    }
  }
  return out
}

const truncate = (s: string, n: number): string =>
  s.length <= n ? s : s.slice(0, n - 1) + "…"

export const MemoryPlugin: Plugin = async ({ $, directory }) => {
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

  const ensureMemoryDir = async (project: string): Promise<string> => {
    const dir = memoryDirFor(project)
    await mkdir(dir, { recursive: true })
    return dir
  }

  await mkdir(ARTIFACT_ROOT, { recursive: true })

  return {
    "shell.env": async (_input, output) => {
      const project = await resolveProject()
      const dir = await ensureMemoryDir(project)
      output.env.OPENCODE_MEMORY_DIR = dir
    },

    tool: {
      memory_read: tool({
        description:
          "Read a single memory entry (raw YAML). Returns file contents or a not-found message.",
        args: {
          slug: tool.schema
            .string()
            .describe("Kebab-case slug (file stem). Spaces → hyphens, lowercased before validation."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to current (git remote → repo dir → cwd)."),
        },
        async execute(args) {
          const v = validateSlug(args.slug)
          if (!v.ok) return v.error
          const project = args.project ?? (await resolveProject())
          const path = memoryPathFor(project, v.slug)
          if (!existsSync(path)) {
            return `No memory at ${path}.`
          }
          const content = await readFile(path, "utf8")
          return `${project}/memory/${v.slug}.yaml:\n${content}`
        },
      }),

      memory_write: tool({
        description: `Write/overwrite a durable per-project memory entry — one YAML file at ~/.opencode-artifacts/<project>/memory/<slug>.yaml.

Memory captures facts and instinct-style behavioral rules so future sessions recall them without rediscovery. It is the terse counterpart to designs: designs are multi-paragraph architectural records with history; memory is one-sentence facts with metadata.

Entry shape:
- note (required): one short sentence, aim ≤120 chars, hard cap 240. State the fact directly, no prose, no "the user said…" framing.
- domain (optional): category tag ('git', 'style', 'testing', 'repo-conventions').
- trigger (optional): condition that activates the entry ('when committing'). Presence promotes it to an **instinct** (situational behavioral rule).
- confidence (optional): 0-1.
- source (optional): 'user-told', 'observed', 'repo-curation'.

Write when:
- The user states a preference the current session won't remember next time.
- A repo convention surfaces that isn't in any rule file and would slow a future session to rediscover.
- A conditional behavioral rule fits a clear trigger (= instinct).

Do NOT write for:
- Session context — use /handoff (ephemeral).
- One-off observations whose cost exceeds the value of remembering.

Instinct vs plain memory is purely the presence of \`trigger\`. Both shapes share the same directory and tools.`,
        args: {
          slug: tool.schema
            .string()
            .describe("Kebab-case slug (e.g. 'conventional-commits')."),
          note: tool.schema
            .string()
            .max(240)
            .describe("The memory. One short sentence, aim ≤120 chars. Hard cap 240."),
          domain: tool.schema
            .string()
            .max(40)
            .optional()
            .describe("Category tag (e.g. 'git', 'style'). Filters memory_list."),
          trigger: tool.schema
            .string()
            .max(120)
            .optional()
            .describe("Condition that activates this entry (e.g. 'when committing'). Presence makes it an instinct."),
          confidence: tool.schema
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe("Confidence 0–1. Omit when not applicable."),
          source: tool.schema
            .string()
            .max(40)
            .optional()
            .describe("Origin tag: 'user-told', 'observed', 'repo-curation'."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to current."),
        },
        async execute(args) {
          const v = validateSlug(args.slug)
          if (!v.ok) return v.error
          const project = args.project ?? (await resolveProject())
          await ensureMemoryDir(project)
          const path = memoryPathFor(project, v.slug)
          const body = serializeEntry({
            note: args.note,
            domain: args.domain,
            trigger: args.trigger,
            confidence: args.confidence,
            source: args.source,
          })
          await writeFile(path, body, "utf8")
          return `Wrote ${body.length} bytes to ${path}.`
        },
      }),

      memory_list: tool({
        description:
          "List memory entries: slug | domain | trigger | note (truncated at 60 chars). Call at task start to surface relevant facts and instincts for the current project — filter by `domain` when the category is known. Use memory_read only when the truncated preview is insufficient.",
        args: {
          domain: tool.schema
            .string()
            .optional()
            .describe("Only list entries matching this domain."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to current."),
        },
        async execute(args) {
          const project = args.project ?? (await resolveProject())
          const dir = memoryDirFor(project)
          if (!existsSync(dir)) {
            return `No memory for '${project}'.`
          }
          const entries = await readdir(dir)
          const yamls = entries.filter((e) => e.endsWith(".yaml"))
          if (yamls.length === 0) {
            return `No memory for '${project}'.`
          }
          const rows = await Promise.all(
            yamls.map(async (name) => {
              const raw = await readFile(join(dir, name), "utf8")
              const parsed = parseEntryFields(raw)
              return {
                slug: name.replace(/\.yaml$/, ""),
                domain: parsed.domain ?? "",
                trigger: parsed.trigger ?? "",
                note: parsed.note ?? "",
              }
            }),
          )
          const filtered = args.domain
            ? rows.filter((r) => r.domain === args.domain)
            : rows
          if (filtered.length === 0) {
            return `No memory for '${project}' in domain '${args.domain}'.`
          }
          const lines = filtered.map(
            (r) =>
              `- ${r.slug} | ${r.domain || "-"} | ${r.trigger || "-"} | ${truncate(r.note, 60)}`,
          )
          return `Memory (${project}):\n${lines.join("\n")}`
        },
      }),

      memory_delete: tool({
        description:
          "Delete memory entries. Scoped to memory/ only — will NOT touch artifacts or designs. Scope by args: `slug`+`project` → one file; `project` only → all memory for that project; `slug` only → that entry across every project; `domain` only → all entries with that domain (in scoped projects); neither → wipe all memory. `confirm: true` required. Returns deleted/skipped paths.",
        args: {
          confirm: tool.schema
            .literal(true)
            .describe("Must be true. Guardrail."),
          slug: tool.schema
            .string()
            .optional()
            .describe("Memory slug (file stem). Omit to scope by project, domain, or wipe all."),
          domain: tool.schema
            .string()
            .optional()
            .describe("Only delete entries whose `domain` matches. Ignored when `slug` is provided."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Omit to apply across all projects."),
        },
        async execute(args) {
          let slug: string | undefined
          if (args.slug !== undefined) {
            const v = validateSlug(args.slug)
            if (!v.ok) return v.error
            slug = v.slug
          }
          const result: DeleteResult = { deleted: [], skipped: [] }
          const projects = args.project ? [args.project] : await collectProjectsWithMemory()

          for (const project of projects) {
            const dir = memoryDirFor(project)
            if (!existsSync(dir)) continue

            if (slug) {
              const path = memoryPathFor(project, slug)
              if (existsSync(path)) await deleteFile(path, result)
            } else if (args.domain) {
              const files = await collectMemories(project)
              for (const path of files) {
                try {
                  const parsed = parseEntryFields(await readFile(path, "utf8"))
                  if (parsed.domain === args.domain) await deleteFile(path, result)
                } catch {
                  result.skipped.push(path)
                }
              }
            } else {
              const files = await collectMemories(project)
              for (const path of files) await deleteFile(path, result)
            }
            await removeEmptyDir(dir)
            await removeEmptyDir(join(ARTIFACT_ROOT, project))
          }

          const noun = result.deleted.length === 1 ? "entry" : "entries"
          const lines = [`Deleted ${result.deleted.length} memory ${noun}.`]
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

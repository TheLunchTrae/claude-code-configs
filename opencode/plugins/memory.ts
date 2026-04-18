// Memory plugin — durable per-project store for facts and instinct-style
// behavioral rules. Sibling to artifacts.ts.
//
// Storage: two pipe-delimited files per project, no field names on disk.
//   ~/.opencode-artifacts/<project>/memory/instincts.txt   slug|trigger|note
//   ~/.opencode-artifacts/<project>/memory/facts.txt       slug|domain|note
//
// Instincts are auto-injected into the system prompt via the
// experimental.chat.system.transform hook on every message, so the model
// always carries them without needing a tool call. Facts stay tool-gated
// (memory_list kind:"facts") so they only cost tokens when explicitly queried.
//
// Shared project-resolution and delete helpers live in ./lib/project.

import { type Plugin, tool } from "@opencode-ai/plugin"
import { mkdir, readdir, readFile, writeFile, rename, unlink } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join } from "node:path"
import {
  ARTIFACT_ROOT,
  type DeleteResult,
  makeResolveProject,
  removeEmptyDir,
} from "./lib/project"

const MEMORY_SUBDIR = "memory"
const INSTINCTS_FILE = "instincts.txt"
const FACTS_FILE = "facts.txt"
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/
const FORBIDDEN_IN_VALUE = /[|\r\n]/
// Hard cap on injected instincts block — keeps silent context bloat from
// accumulating as the user adds rules. ~4 chars per token → ~500 tokens.
const INJECT_MAX_CHARS = 2000

const memoryDirFor = (project: string): string =>
  join(ARTIFACT_ROOT, project, MEMORY_SUBDIR)

const instinctsPath = (project: string): string =>
  join(memoryDirFor(project), INSTINCTS_FILE)

const factsPath = (project: string): string =>
  join(memoryDirFor(project), FACTS_FILE)

type Kind = "instincts" | "facts"

const pathFor = (project: string, kind: Kind): string =>
  kind === "instincts" ? instinctsPath(project) : factsPath(project)

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

const validateValue = (field: string, value: string): string | undefined => {
  if (FORBIDDEN_IN_VALUE.test(value)) {
    return `Invalid ${field}: contains '|', '\\n', or '\\r'. These are reserved delimiters — paraphrase to remove them.`
  }
  return undefined
}

const readLines = async (path: string): Promise<string[]> => {
  if (!existsSync(path)) return []
  const raw = await readFile(path, "utf8")
  return raw.split(/\r?\n/).filter((l) => l.length > 0)
}

// Slug is always column 0. Cheap without a full parse.
const slugOf = (line: string): string => {
  const i = line.indexOf("|")
  return i === -1 ? line : line.slice(0, i)
}

const atomicReplace = async (path: string, body: string): Promise<void> => {
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`
  await writeFile(tmp, body, "utf8")
  try {
    await rename(tmp, path)
  } catch (err) {
    try {
      await unlink(tmp)
    } catch {
      // ignore cleanup failure
    }
    throw err
  }
}

const writeLines = async (path: string, lines: string[]): Promise<void> => {
  if (lines.length === 0) {
    if (existsSync(path)) await unlink(path)
    return
  }
  const sorted = [...lines].sort((a, b) => slugOf(a).localeCompare(slugOf(b)))
  await atomicReplace(path, sorted.join("\n") + "\n")
}

const ensureMemoryDir = async (project: string): Promise<string> => {
  const dir = memoryDirFor(project)
  await mkdir(dir, { recursive: true })
  return dir
}

const collectProjectsWithMemory = async (): Promise<string[]> => {
  if (!existsSync(ARTIFACT_ROOT)) return []
  const entries = await readdir(ARTIFACT_ROOT, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((p) => existsSync(memoryDirFor(p)))
}

const truncateInjected = (body: string): string => {
  if (body.length <= INJECT_MAX_CHARS) return body
  const head = body.slice(0, INJECT_MAX_CHARS - 64)
  const lastNl = head.lastIndexOf("\n")
  const cut = lastNl > 0 ? head.slice(0, lastNl) : head
  return `${cut}\n… (truncated — call memory_list kind:"instincts" for the full set)`
}

const formatInjectedInstincts = (project: string, lines: string[]): string | undefined => {
  if (lines.length === 0) return undefined
  // Drop slug when injecting — LLM doesn't need the primary key; it only
  // needs trigger → note. Saves ~5-10 tokens per entry.
  const rules = lines
    .map((line) => {
      const parts = line.split("|", 3)
      if (parts.length < 3) return undefined
      const [, trigger, note] = parts
      return `${trigger}: ${note}`
    })
    .filter((r): r is string => r !== undefined)
  if (rules.length === 0) return undefined
  const body = `Instincts (${project}) — follow when the "when" fires:\n${rules.join("\n")}`
  return truncateInjected(body)
}

const formatListOutput = (project: string, kind: Kind, lines: string[]): string => {
  if (lines.length === 0) {
    return `no ${kind} (${project}).`
  }
  return `${kind} (${project}):\n${lines.join("\n")}`
}

export const MemoryPlugin: Plugin = async ({ $, directory }) => {
  const resolveProject = makeResolveProject({ $, directory })

  await mkdir(ARTIFACT_ROOT, { recursive: true })

  return {
    "shell.env": async (_input, output) => {
      const project = await resolveProject()
      const dir = await ensureMemoryDir(project)
      output.env.OPENCODE_MEMORY_DIR = dir
    },

    "experimental.chat.system.transform": async (_input, output) => {
      const project = await resolveProject()
      const lines = await readLines(instinctsPath(project))
      const block = formatInjectedInstincts(project, lines)
      if (block) output.system.push(block)
    },

    tool: {
      memory_list: tool({
        description: `List memory entries. Defaults to kind:"instincts" for the lightest surface.

Instincts are auto-injected into the system prompt every message, so normally you do not need to call this — only do so when you want to see slugs (for memory_write/memory_delete) or when you need facts.

Output format is the raw on-disk line per entry:
- instincts: slug|trigger|note
- facts: slug|domain|note`,
        args: {
          kind: tool.schema
            .enum(["instincts", "facts", "all"])
            .optional()
            .describe("Which set to list. Default 'instincts'."),
          domain: tool.schema
            .string()
            .optional()
            .describe("Facts only: filter by exact domain match."),
          slug: tool.schema
            .string()
            .optional()
            .describe("Exact-match lookup by slug across the selected kind(s)."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to current (git remote → repo dir → cwd)."),
        },
        async execute(args) {
          const project = args.project ?? (await resolveProject())
          const kind = args.kind ?? "instincts"

          let slugNorm: string | undefined
          if (args.slug !== undefined) {
            const v = validateSlug(args.slug)
            if (!v.ok) return v.error
            slugNorm = v.slug
          }

          const wantInstincts = kind === "instincts" || kind === "all"
          const wantFacts = kind === "facts" || kind === "all"

          const sections: string[] = []

          if (wantInstincts) {
            let lines = await readLines(instinctsPath(project))
            if (slugNorm) lines = lines.filter((l) => slugOf(l) === slugNorm)
            sections.push(formatListOutput(project, "instincts", lines))
          }

          if (wantFacts) {
            let lines = await readLines(factsPath(project))
            if (slugNorm) lines = lines.filter((l) => slugOf(l) === slugNorm)
            if (args.domain !== undefined) {
              lines = lines.filter((l) => l.split("|", 3)[1] === args.domain)
            }
            sections.push(formatListOutput(project, "facts", lines))
          }

          return sections.join("\n\n")
        },
      }),

      memory_write: tool({
        description: `Write or overwrite a durable per-project memory entry — one line in instincts.txt or facts.txt under ~/.opencode-artifacts/<project>/memory/.

Classify the entry:
- kind:"instinct" — a behavioral rule the future session should follow when a condition fires. Requires \`trigger\` (the "when"). Auto-injected into every system prompt.
- kind:"fact" — a piece of context the session can look up when relevant. Requires \`domain\` (the filter key). Tool-gated, not auto-injected.

Write when:
- The user states a preference the current session won't remember next time.
- A repo convention surfaces that isn't in any rule file and would slow a future session to rediscover.

Do NOT write for:
- Session context — use /handoff (ephemeral).
- One-off observations whose cost exceeds the value of remembering.

Values may not contain '|', '\\n', or '\\r' — paraphrase. Slugs are unique per project across both kinds; to change an entry's kind, memory_delete it first.`,
        args: {
          kind: tool.schema
            .enum(["instinct", "fact"])
            .describe("'instinct' for a triggered behavioral rule; 'fact' for domain-tagged context."),
          slug: tool.schema
            .string()
            .describe("Kebab-case slug (e.g. 'conventional-commits'). Unique per project across both kinds."),
          note: tool.schema
            .string()
            .max(240)
            .describe("The memory. One short sentence, aim ≤120 chars. Hard cap 240. No '|' or newlines."),
          trigger: tool.schema
            .string()
            .max(120)
            .optional()
            .describe("Required for kind:'instinct'. The 'when' condition (e.g. 'when committing')."),
          domain: tool.schema
            .string()
            .max(40)
            .optional()
            .describe("Required for kind:'fact'. Category tag (e.g. 'git', 'testing'). Filters memory_list."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Defaults to current."),
        },
        async execute(args) {
          const v = validateSlug(args.slug)
          if (!v.ok) return v.error
          const slug = v.slug

          const noteErr = validateValue("note", args.note)
          if (noteErr) return noteErr

          const isInstinct = args.kind === "instinct"

          if (isInstinct) {
            if (args.trigger === undefined) {
              return "kind:'instinct' requires 'trigger' — the 'when' condition that activates the rule."
            }
            if (args.domain !== undefined) {
              return "kind:'instinct' does not take 'domain'. Drop the domain arg or switch to kind:'fact'."
            }
            const trigErr = validateValue("trigger", args.trigger)
            if (trigErr) return trigErr
          } else {
            if (args.domain === undefined) {
              return "kind:'fact' requires 'domain' — a short category tag used to filter memory_list."
            }
            if (args.trigger !== undefined) {
              return "kind:'fact' does not take 'trigger'. Drop the trigger arg or switch to kind:'instinct'."
            }
            const domErr = validateValue("domain", args.domain)
            if (domErr) return domErr
          }

          const project = args.project ?? (await resolveProject())
          await ensureMemoryDir(project)

          const targetKind: Kind = isInstinct ? "instincts" : "facts"
          const otherKind: Kind = isInstinct ? "facts" : "instincts"

          const otherLines = await readLines(pathFor(project, otherKind))
          if (otherLines.some((l) => slugOf(l) === slug)) {
            return `Slug '${slug}' already exists as a ${otherKind.slice(0, -1)}. Run memory_delete confirm:true slug:"${slug}" first, then re-write as ${args.kind}.`
          }

          const existing = await readLines(pathFor(project, targetKind))
          const filtered = existing.filter((l) => slugOf(l) !== slug)
          const newLine = isInstinct
            ? `${slug}|${args.trigger}|${args.note}`
            : `${slug}|${args.domain}|${args.note}`
          filtered.push(newLine)
          await writeLines(pathFor(project, targetKind), filtered)

          const path = pathFor(project, targetKind)
          return `wrote ${args.kind} ${slug} to ${path} (${filtered.length} ${targetKind}, ${newLine.length} bytes).`
        },
      }),

      memory_delete: tool({
        description: `Delete memory entries. Scoped to memory/ only — will NOT touch artifacts or designs.

Scope by args:
- slug only → remove that slug from whichever file holds it (instincts or facts).
- domain only → remove matching facts (instincts ignore 'domain').
- kind only → wipe that file.
- kind + slug → remove that slug from only the named kind.
- kind + domain → remove matching facts (only meaningful with kind:'facts' or 'all').
- nothing set → wipe both files for the project.

confirm:true required. Returns deleted slug list per kind.`,
        args: {
          confirm: tool.schema
            .literal(true)
            .describe("Must be true. Guardrail."),
          slug: tool.schema
            .string()
            .optional()
            .describe("Memory slug. Omit to scope by kind/domain or wipe."),
          kind: tool.schema
            .enum(["instincts", "facts", "all"])
            .optional()
            .describe("Which file(s) to operate on. Default 'all'."),
          domain: tool.schema
            .string()
            .optional()
            .describe("Facts only: delete entries whose domain matches. Ignored when slug is also provided."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Omit to apply across all projects."),
        },
        async execute(args) {
          let slugNorm: string | undefined
          if (args.slug !== undefined) {
            const v = validateSlug(args.slug)
            if (!v.ok) return v.error
            slugNorm = v.slug
          }

          const kind = args.kind ?? "all"
          const result: DeleteResult = { deleted: [], skipped: [] }
          let totalRemoved = 0
          const projects = args.project ? [args.project] : await collectProjectsWithMemory()

          // Returns a matcher that identifies lines to REMOVE, or undefined to
          // skip this file entirely. When no matcher fields are set, remove all.
          const matcherFor = (forKind: Kind): ((line: string) => boolean) | undefined => {
            if (slugNorm) return (l) => slugOf(l) === slugNorm
            if (args.domain !== undefined) {
              // 'domain' is facts-only; ignore files that can't match.
              if (forKind !== "facts") return undefined
              return (l) => l.split("|", 3)[1] === args.domain
            }
            return () => true
          }

          const applyToFile = async (path: string, forKind: Kind): Promise<void> => {
            if (!existsSync(path)) return
            const matcher = matcherFor(forKind)
            if (!matcher) return
            const before = await readLines(path)
            const after = before.filter((l) => !matcher(l))
            const removed = before.length - after.length
            if (removed === 0) return
            try {
              if (after.length === 0) {
                await unlink(path)
              } else {
                await writeLines(path, after)
              }
              totalRemoved += removed
              result.deleted.push(path)
            } catch {
              result.skipped.push(path)
            }
          }

          for (const project of projects) {
            const dir = memoryDirFor(project)
            if (!existsSync(dir)) continue

            if (kind === "instincts" || kind === "all") {
              await applyToFile(instinctsPath(project), "instincts")
            }
            if (kind === "facts" || kind === "all") {
              await applyToFile(factsPath(project), "facts")
            }

            await removeEmptyDir(dir)
            await removeEmptyDir(join(ARTIFACT_ROOT, project))
          }

          const noun = totalRemoved === 1 ? "entry" : "entries"
          const lines = [`Deleted ${totalRemoved} memory ${noun}.`]
          if (result.deleted.length > 0) {
            lines.push(...result.deleted.map((p) => `  - ${p}`))
          }
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

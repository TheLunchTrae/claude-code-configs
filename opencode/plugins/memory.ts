// Memory plugin — durable store for manually-authored rules and facts,
// scoped to the current project or global. Sibling to artifacts.ts.
//
// Storage: two pipe-delimited files per scope, no field names on disk.
//   ~/.opencode-data/memory/<project>/rules.txt   slug|trigger|note
//   ~/.opencode-data/memory/<project>/facts.txt   slug|domain|note
//   ~/.opencode-data/memory/_global/rules.txt     (global scope)
//   ~/.opencode-data/memory/_global/facts.txt     (global scope)
//
// Memory lives in its own top-level subtree (not under artifacts/) so
// artifact-cleanup tooling can never reach it by accident.
//
// Rules (both scopes merged, globals first) are auto-injected into the system
// prompt via the experimental.chat.system.transform hook on every message,
// so the model always carries them without needing a tool call. Facts stay
// tool-gated (memory_list kind:"facts") so they only cost tokens when
// explicitly queried.
//
// "_global" is a reserved project name; a project literally named "_global"
// will share storage with the global scope.
//
// RESERVED: instincts.txt under each memory scope dir is reserved for a
// future observer-derived store (ECC-style: hooks capture traces →
// background agent extracts instincts with confidence/evidence). The
// current tool surface does NOT write instincts — they come only from
// observation. Until that ships, no tool here reads or writes that file.
//
// Shared project-resolution and delete helpers live in ./lib/project.

import { type Plugin, tool } from "@opencode-ai/plugin"
import { mkdir, readdir, readFile, writeFile, rename, unlink } from "node:fs/promises"
import { existsSync } from "node:fs"
import { basename, join } from "node:path"
import {
  type DeleteResult,
  formatErr,
  MEMORY_ROOT,
  removeEmptyDir,
} from "./lib/project"

const RULES_FILE = "rules.txt"
const FACTS_FILE = "facts.txt"
const GLOBAL_PROJECT = "_global"
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/
const FORBIDDEN_IN_VALUE = /[|\r\n]/
// Hard cap on injected rules block — keeps silent context bloat from
// accumulating as the user adds rules. ~4 chars per token → ~500 tokens.
const INJECT_MAX_CHARS = 2000
// Sentinel marker kept at the top of the injected block so repeated turns can
// detect and replace a prior injection instead of stacking duplicates.
const INJECT_SENTINEL = "<!-- memory-plugin -->"

const memoryDirFor = (project: string): string =>
  join(MEMORY_ROOT, project)

const rulesPath = (project: string): string =>
  join(memoryDirFor(project), RULES_FILE)

const factsPath = (project: string): string =>
  join(memoryDirFor(project), FACTS_FILE)

type Kind = "rules" | "facts"

const pathFor = (project: string, kind: Kind): string =>
  kind === "rules" ? rulesPath(project) : factsPath(project)

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
  if (!existsSync(MEMORY_ROOT)) return []
  const entries = await readdir(MEMORY_ROOT, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

const truncateInjected = (body: string): string => {
  if (body.length <= INJECT_MAX_CHARS) return body
  const head = body.slice(0, INJECT_MAX_CHARS - 64)
  const lastNl = head.lastIndexOf("\n")
  const cut = lastNl > 0 ? head.slice(0, lastNl) : head
  return `${cut}\n… (truncated — call memory_list kind:"rules" for the full set)`
}

const formatInjectedRules = (lines: string[]): string | undefined => {
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
  const body = `${INJECT_SENTINEL}\nRules — follow when the "when" fires:\n${rules.join("\n")}`
  return truncateInjected(body)
}

const formatListOutput = (project: string, kind: Kind, lines: string[]): string => {
  if (lines.length === 0) {
    return `no ${kind} (${project}).`
  }
  return `${kind} (${project}):\n${lines.join("\n")}`
}

export const MemoryPlugin: Plugin = async ({ client, project }) => {
  const projectName = basename(project.worktree)

  await mkdir(MEMORY_ROOT, { recursive: true })

  const logErr = async (where: string, err: unknown): Promise<void> => {
    try {
      await client.app.log({
        body: { service: "plugin/memory", level: "error", message: `${where}: ${formatErr(err)}` },
      })
    } catch {
      console.error(`[plugin/memory] ${where}:`, err)
    }
  }

  return {
    "shell.env": async (_input, output) => {
      try {
        const dir = await ensureMemoryDir(projectName)
        output.env.OPENCODE_MEMORY_DIR = dir
      } catch (err) {
        await logErr("shell.env injection failed", err)
      }
    },

    "experimental.chat.system.transform": async (_input, output) => {
      // Idempotency: strip any prior injection from this plugin before pushing
      // a fresh one, so re-runs of the hook can't stack duplicates.
      output.system = output.system.filter((s) => !s.includes(INJECT_SENTINEL))
      try {
        // Globals first so project-scoped rules come last — if the model reads
        // top-down and treats later rules as refinements, project wins.
        const globalLines = await readLines(rulesPath(GLOBAL_PROJECT))
        const projectLines = projectName === GLOBAL_PROJECT ? [] : await readLines(rulesPath(projectName))
        const block = formatInjectedRules([...globalLines, ...projectLines])
        if (block) output.system.push(block)
      } catch (err) {
        // Rules injection is best-effort; missing rules shouldn't break message processing.
        await logErr("rules injection failed", err)
      }
    },

    tool: {
      memory_list: tool({
        description: `List memory entries. Defaults to kind:"rules" scope:"all" — shows both global and project rules.

Rules (global + project, merged) are auto-injected into the system prompt every message, so normally you do not need to call this — only do so when you want to see slugs (for memory_write/memory_delete) or when you need facts.

Output format is the raw on-disk line per entry:
- rules: slug|trigger|note
- facts: slug|domain|note`,
        args: {
          kind: tool.schema
            .enum(["rules", "facts", "all"])
            .optional()
            .describe("Which set to list. Default 'rules'."),
          scope: tool.schema
            .enum(["project", "global", "all"])
            .optional()
            .describe("Which scope(s) to list. Default 'all' (both global and project)."),
          domain: tool.schema
            .string()
            .optional()
            .describe("Facts only: filter by exact domain match."),
          slug: tool.schema
            .string()
            .optional()
            .describe("Exact-match lookup by slug across the selected kind(s) and scope(s)."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Only valid when scope is 'project' or omitted. Defaults to current."),
        },
        async execute(args) {
          try {
            const kind = args.kind ?? "rules"
            const scope = args.scope ?? "all"

            if (args.project && scope === "global") {
              return "`project` is not valid with scope:\"global\". Drop one."
            }

            let slugNorm: string | undefined
            if (args.slug !== undefined) {
              const v = validateSlug(args.slug)
              if (!v.ok) return v.error
              slugNorm = v.slug
            }

            const targets: Array<{ label: string; project: string }> = []
            if (scope === "global" || scope === "all") {
              targets.push({ label: "global", project: GLOBAL_PROJECT })
            }
            if (scope === "project" || scope === "all") {
              const p = args.project ?? projectName
              if (p !== GLOBAL_PROJECT) targets.push({ label: p, project: p })
            }

            const wantRules = kind === "rules" || kind === "all"
            const wantFacts = kind === "facts" || kind === "all"

            const sections: string[] = []

            for (const t of targets) {
              if (wantRules) {
                let lines = await readLines(rulesPath(t.project))
                if (slugNorm) lines = lines.filter((l) => slugOf(l) === slugNorm)
                sections.push(formatListOutput(t.label, "rules", lines))
              }
              if (wantFacts) {
                let lines = await readLines(factsPath(t.project))
                if (slugNorm) lines = lines.filter((l) => slugOf(l) === slugNorm)
                if (args.domain !== undefined) {
                  lines = lines.filter((l) => l.split("|", 3)[1] === args.domain)
                }
                sections.push(formatListOutput(t.label, "facts", lines))
              }
            }

            return sections.join("\n\n")
          } catch (err) {
            return `memory_list failed: ${formatErr(err)}`
          }
        },
      }),

      memory_write: tool({
        description: `Write or overwrite a durable memory entry — one line in rules.txt or facts.txt under ~/.opencode-data/memory/<project>/ (or ~/.opencode-data/memory/_global/ for scope:"global").

Classify the entry:
- kind:"rule" — a behavioral directive the future session should follow when a condition fires. Requires \`trigger\` (the "when"). Auto-injected into every system prompt.
- kind:"fact" — a piece of context the session can look up when relevant. Requires \`domain\` (the filter key). Tool-gated, not auto-injected.

Choose scope:
- scope:"project" (default) — applies only to the current project.
- scope:"global" — applies to every project. Reserve for universally-true rules (e.g. security practices) or preferences the user holds across all repos.

Write when:
- The user states a preference the current session won't remember next time.
- A repo convention surfaces that isn't in any rule file and would slow a future session to rediscover.

Do NOT write for:
- Session context — use /handoff (ephemeral).
- One-off observations whose cost exceeds the value of remembering.

Note: instincts.txt under each memory scope dir is reserved for a future observer-derived store (learned behaviors with confidence/evidence). This tool does not write there — asserted behavior goes to rules, observed behavior will come from the observer.

Values may not contain '|', '\\n', or '\\r' — paraphrase. Slugs are unique per scope across both kinds; to change an entry's kind within a scope, memory_delete it first.`,
        args: {
          kind: tool.schema
            .enum(["rule", "fact"])
            .describe("'rule' for a triggered behavioral directive; 'fact' for domain-tagged context."),
          slug: tool.schema
            .string()
            .describe("Kebab-case slug (e.g. 'conventional-commits'). Unique per scope across both kinds."),
          note: tool.schema
            .string()
            .max(240)
            .describe("The memory. One short sentence, aim ≤120 chars. Hard cap 240. No '|' or newlines."),
          trigger: tool.schema
            .string()
            .max(120)
            .optional()
            .describe("Required for kind:'rule'. The 'when' condition (e.g. 'when committing')."),
          domain: tool.schema
            .string()
            .max(40)
            .optional()
            .describe("Required for kind:'fact'. Category tag (e.g. 'git', 'testing'). Filters memory_list."),
          scope: tool.schema
            .enum(["project", "global"])
            .optional()
            .describe("'project' (default) for current-project-only, or 'global' for every project."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name override. Only valid when scope is 'project' or omitted. Defaults to current."),
        },
        async execute(args) {
          try {
            const v = validateSlug(args.slug)
            if (!v.ok) return v.error
            const slug = v.slug

            const noteErr = validateValue("note", args.note)
            if (noteErr) return noteErr

            const scope = args.scope ?? "project"

            if (args.project && scope === "global") {
              return "`project` is not valid with scope:\"global\". Drop one."
            }

            const isRule = args.kind === "rule"

            if (isRule) {
              if (args.trigger === undefined) {
                return "kind:'rule' requires 'trigger' — the 'when' condition that activates the directive."
              }
              if (args.domain !== undefined) {
                return "kind:'rule' does not take 'domain'. Drop the domain arg or switch to kind:'fact'."
              }
              const trigErr = validateValue("trigger", args.trigger)
              if (trigErr) return trigErr
            } else {
              if (args.domain === undefined) {
                return "kind:'fact' requires 'domain' — a short category tag used to filter memory_list."
              }
              if (args.trigger !== undefined) {
                return "kind:'fact' does not take 'trigger'. Drop the trigger arg or switch to kind:'rule'."
              }
              const domErr = validateValue("domain", args.domain)
              if (domErr) return domErr
            }

            const project = scope === "global" ? GLOBAL_PROJECT : (args.project ?? projectName)
            await ensureMemoryDir(project)

            const targetKind: Kind = isRule ? "rules" : "facts"
            const otherKind: Kind = isRule ? "facts" : "rules"

            // Cross-kind collision is scoped: same slug can coexist across
            // project/global (project may intentionally shadow global).
            const otherLines = await readLines(pathFor(project, otherKind))
            if (otherLines.some((l) => slugOf(l) === slug)) {
              const scopeHint = scope === "global" ? ' scope:"global"' : ""
              return `Slug '${slug}' already exists as a ${otherKind.slice(0, -1)} in this scope. Run memory_delete confirm:true slug:"${slug}"${scopeHint} first, then re-write as ${args.kind}.`
            }

            const existing = await readLines(pathFor(project, targetKind))
            const filtered = existing.filter((l) => slugOf(l) !== slug)
            const newLine = isRule
              ? `${slug}|${args.trigger}|${args.note}`
              : `${slug}|${args.domain}|${args.note}`
            filtered.push(newLine)
            await writeLines(pathFor(project, targetKind), filtered)

            const path = pathFor(project, targetKind)
            const scopeLabel = scope === "global" ? "global" : project
            return `wrote ${args.kind} ${slug} (${scopeLabel}) to ${path} (${filtered.length} ${targetKind}, ${newLine.length} bytes).`
          } catch (err) {
            return `memory_write failed: ${formatErr(err)}`
          }
        },
      }),

      memory_delete: tool({
        description: `Delete memory entries. Scoped to memory/ only — will NOT touch artifacts or designs.

Scope by args:
- slug only → remove that slug from whichever file holds it (rules or facts), across the selected scope(s).
- domain only → remove matching facts (rules ignore 'domain').
- kind only → wipe that file.
- kind + slug → remove that slug from only the named kind.
- kind + domain → remove matching facts (only meaningful with kind:'facts' or 'all').
- scope:"global" → restrict to global storage. scope:"project" → restrict to project storage. scope:"all" (default) → both.
- nothing set → wipe both files across all scopes.

confirm:true required. Returns deleted file paths.`,
        args: {
          confirm: tool.schema
            .literal(true)
            .describe("Must be true. Guardrail."),
          slug: tool.schema
            .string()
            .optional()
            .describe("Memory slug. Omit to scope by kind/domain or wipe."),
          kind: tool.schema
            .enum(["rules", "facts", "all"])
            .optional()
            .describe("Which file(s) to operate on. Default 'all'."),
          scope: tool.schema
            .enum(["project", "global", "all"])
            .optional()
            .describe("Which scope(s) to operate on. Default 'all' (both global and project)."),
          domain: tool.schema
            .string()
            .optional()
            .describe("Facts only: delete entries whose domain matches. Ignored when slug is also provided."),
          project: tool.schema
            .string()
            .optional()
            .describe("Project name. Only valid when scope is 'project' or omitted. Omit to apply across all projects."),
        },
        async execute(args) {
          try {
            let slugNorm: string | undefined
            if (args.slug !== undefined) {
              const v = validateSlug(args.slug)
              if (!v.ok) return v.error
              slugNorm = v.slug
            }

            const kind = args.kind ?? "all"
            const scope = args.scope ?? "all"

            if (args.project && scope !== "project") {
              return `\`project\` is not valid with scope:"${scope}". Drop one.`
            }

            // Build the project list according to scope.
            let projects: string[]
            if (scope === "global") {
              projects = [GLOBAL_PROJECT]
            } else if (scope === "project") {
              projects = args.project
                ? [args.project]
                : (await collectProjectsWithMemory()).filter((p) => p !== GLOBAL_PROJECT)
            } else {
              projects = args.project ? [args.project] : await collectProjectsWithMemory()
            }

            const result: DeleteResult = { deleted: [], skipped: [] }
            let totalRemoved = 0

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

              if (kind === "rules" || kind === "all") {
                await applyToFile(rulesPath(project), "rules")
              }
              if (kind === "facts" || kind === "all") {
                await applyToFile(factsPath(project), "facts")
              }

              await removeEmptyDir(dir)
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
          } catch (err) {
            return `memory_delete failed: ${formatErr(err)}`
          }
        },
      }),
    },
  }
}

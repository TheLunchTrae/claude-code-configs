// Sync-configs plugin — fetches OpenCode config files from upstream GitHub
// into the local install. Implements the mechanical work of /sync-configs as
// two tools: sync_configs_plan (read-only diagnosis) and sync_configs_apply
// (mutating commit). The /sync-configs slash command orchestrates them and
// surfaces user decisions for non-allowlisted drift.
//
// Lives under .opencode/plugins/ (not opencode/plugins/) so it is auto-
// discovered as a project-local plugin only when OpenCode loads this
// repo's .opencode/ config dir, not in unrelated workspaces.
//
// State: ~/.opencode-data/sync-configs/<project>/version contains the
// last-synced manifest version integer for this project. No format, no
// schema. Sibling subtree to artifacts/ and memory/.
//
// HTTP: native fetch (Node 18+); no curl, no SDK calls. opencode.jsonc is
// always deferred to the user when it differs — no JSONC merge logic in
// this plugin.
//
// Plan/apply contract: plan returns metadata only (no file bodies for
// 'updated' paths) so the LLM round-trip stays small. Apply re-fetches
// from upstream for 'updated' paths and 'drop' decisions. needs-user-
// decision entries keep their remote/local bodies because the LLM uses
// them when the user picks 'custom' (hand-merged) and there's no clean
// way to re-derive that.

import { type Plugin, type PluginInput, tool } from "@opencode-ai/plugin"
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, join } from "node:path"

type Client = PluginInput["client"]

const formatErr = (err: unknown): string =>
  err instanceof Error ? err.message : String(err)

const SYNC_CONFIGS_ROOT = join(homedir(), ".opencode-data", "sync-configs")

const BASE_URL =
  "https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/"
const MANIFEST_PATH = ".opencode/sync-configs-manifest.json"
const PLUGIN_SELF_PATH = ".opencode/plugins/sync-configs.ts"
const ALWAYS_DEFER_PATHS: ReadonlySet<string> = new Set(["opencode.jsonc"])

const versionPathFor = (project: string): string =>
  join(SYNC_CONFIGS_ROOT, project, "version")

const ensureVersionDir = async (project: string): Promise<void> => {
  await mkdir(join(SYNC_CONFIGS_ROOT, project), { recursive: true })
}

const readLocalVersion = async (project: string): Promise<number | undefined> => {
  const path = versionPathFor(project)
  if (!existsSync(path)) return undefined
  const raw = (await readFile(path, "utf8")).trim()
  const n = Number(raw)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return undefined
  return n
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

const writeLocalVersion = async (project: string, version: number): Promise<void> => {
  await ensureVersionDir(project)
  await atomicReplace(versionPathFor(project), `${version}\n`)
}

type ParsedManifest = {
  version: number
  syncPaths: string[]
  deletePaths: string[]
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string")

const parseManifest = (body: string): ParsedManifest | { error: string } => {
  let raw: unknown
  try {
    raw = JSON.parse(body)
  } catch (err) {
    return { error: `manifest is not valid JSON: ${formatErr(err)}` }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "manifest must be a JSON object" }
  }
  const obj = raw as Record<string, unknown>
  if (typeof obj.version !== "number" || !Number.isInteger(obj.version) || obj.version < 0) {
    return { error: "manifest 'version' must be a non-negative integer" }
  }
  if (!obj.paths || typeof obj.paths !== "object" || Array.isArray(obj.paths)) {
    return { error: "manifest 'paths' must be an object whose values are string arrays" }
  }
  const syncPaths: string[] = []
  for (const [key, val] of Object.entries(obj.paths as Record<string, unknown>)) {
    if (!isStringArray(val)) {
      return { error: `manifest 'paths.${key}' must be a string array` }
    }
    syncPaths.push(...val)
  }
  if (!isStringArray(obj.deleted ?? [])) {
    return { error: "manifest 'deleted' must be a string array" }
  }
  const deletePaths = (obj.deleted as string[] | undefined) ?? []
  return { version: obj.version, syncPaths, deletePaths }
}

type FetchOk = { ok: true; body: string }
type FetchErr = { ok: false; reason: string }

const HTML_404_PREFIXES = ["<!DOCTYPE html", "<html"]

const fetchUpstream = async (relPath: string): Promise<FetchOk | FetchErr> => {
  const url = `${BASE_URL}${relPath}`
  let res: Response
  try {
    res = await fetch(url)
  } catch (err) {
    return { ok: false, reason: `network error: ${formatErr(err)}` }
  }
  if (!res.ok) {
    return { ok: false, reason: `HTTP ${res.status} ${res.statusText}` }
  }
  const body = await res.text()
  if (body.trim().length === 0) {
    return { ok: false, reason: "empty response body" }
  }
  const head = body.trimStart()
  for (const prefix of HTML_404_PREFIXES) {
    if (head.startsWith(prefix)) {
      return { ok: false, reason: "response is HTML (likely a 404 page)" }
    }
  }
  return { ok: true, body }
}

type PathPlan =
  | { path: string; status: "unchanged" }
  | { path: string; status: "updated" }
  | {
      path: string
      status: "needs-user-decision"
      remote: string
      local: string
      reason: string
      local_only_lines: string[]
    }
  | { path: string; status: "failed"; reason: string }

// Returns the set of non-empty local lines that do not appear anywhere in the
// remote. If empty, applying the remote loses nothing the user added.
const localOnlyLines = (local: string, remote: string): string[] => {
  const remoteLines = new Set(remote.split(/\r?\n/))
  const out: string[] = []
  for (const line of local.split(/\r?\n/)) {
    if (line.trim().length === 0) continue
    if (!remoteLines.has(line)) out.push(line)
  }
  return out
}

type PlanResult = {
  short_circuit?: { reason: string; version: number }
  manifest_version: number
  last_version: number | undefined
  paths: PathPlan[]
  delete_paths: string[]
  delete_skipped_first_run?: boolean
}

const classifyPath = async (
  path: string,
  fetchResult: FetchOk | FetchErr,
): Promise<PathPlan> => {
  if (!fetchResult.ok) {
    return { path, status: "failed", reason: fetchResult.reason }
  }
  const remote = fetchResult.body
  if (!existsSync(path)) {
    return { path, status: "updated" }
  }
  const local = await readFile(path, "utf8")
  if (local === remote) {
    return { path, status: "unchanged" }
  }
  if (ALWAYS_DEFER_PATHS.has(path)) {
    return {
      path,
      status: "needs-user-decision",
      remote,
      local,
      reason: "always-defer file (manual permission/customization expected)",
      local_only_lines: localOnlyLines(local, remote),
    }
  }
  // If every non-empty local line also appears in the remote, applying remote
  // loses nothing the user added — treat as a routine upstream update.
  const drift = localOnlyLines(local, remote)
  if (drift.length === 0) {
    return { path, status: "updated" }
  }
  return {
    path,
    status: "needs-user-decision",
    remote,
    local,
    reason: "local has lines not present upstream (drift)",
    local_only_lines: drift,
  }
}

const writeFileEnsuringDir = async (path: string, body: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true })
  await atomicReplace(path, body)
}

type ApplyResult = {
  version: number
  updated: string[]
  preserved: string[]
  deleted: string[]
  failed: { path: string; reason: string }[]
  unresolved: string[]
  version_advanced: boolean
  plugin_self_updated: boolean
}

const showToast = (client: Client, message: string, variant: "info" | "error" = "info"): void => {
  void client.tui
    .showToast({ body: { title: "sync-configs", message, variant } })
    .catch(() => {
      // toast surface unavailable — swallow
    })
}

const logErr = async (client: Client, where: string, err: unknown): Promise<void> => {
  try {
    await client.app.log({
      body: { service: "plugin/sync-configs", level: "error", message: `${where}: ${formatErr(err)}` },
    })
  } catch {
    console.error(`[plugin/sync-configs] ${where}:`, err)
  }
}

export const SyncConfigsPlugin: Plugin = async ({ client, project }) => {
  const projectName = basename(project.worktree)

  await mkdir(SYNC_CONFIGS_ROOT, { recursive: true })

  return {
    tool: {
      sync_configs_plan: tool({
        description:
          "Internal — invoked only by the /sync-configs slash command. Do not call autonomously. " +
          "Fetches the upstream manifest, compares versions, fetches every tracked path in parallel, " +
          "and returns a structured plan: { manifest_version, last_version, paths: [{path, status, ...}], " +
          "delete_paths }. Writes nothing. Status values: 'unchanged' (no further work), 'updated' " +
          "(metadata only — apply re-fetches and writes the upstream body), 'needs-user-decision' " +
          "(includes remote+local bodies and local_only_lines for the merge UX; caller collects " +
          "preserve/drop/custom and passes to sync_configs_apply), 'failed' (with reason). When " +
          "manifest_version equals last_version, returns short_circuit and no per-path detail. " +
          "Plan output is intentionally body-free for 'updated' paths so cold-start runs don't blow " +
          "the LLM tool-result size budget.",
        args: {},
        async execute() {
          try {
            showToast(client, "planning sync")

            const manifestFetch = await fetchUpstream(MANIFEST_PATH)
            if (!manifestFetch.ok) {
              return JSON.stringify({
                error: `manifest fetch failed: ${manifestFetch.reason}`,
              })
            }

            const parsed = parseManifest(manifestFetch.body)
            if ("error" in parsed) {
              return JSON.stringify({ error: parsed.error })
            }

            const lastVersion = await readLocalVersion(projectName)

            if (lastVersion !== undefined && lastVersion === parsed.version) {
              const result: PlanResult = {
                short_circuit: { reason: "already up to date", version: parsed.version },
                manifest_version: parsed.version,
                last_version: lastVersion,
                paths: [],
                delete_paths: [],
              }
              return JSON.stringify(result)
            }

            const fetchResults = await Promise.all(
              parsed.syncPaths.map(async (p) => ({ p, r: await fetchUpstream(p) })),
            )

            const reportedPaths = new Set<string>()
            const paths: PathPlan[] = []
            for (const { p, r } of fetchResults) {
              const plan = await classifyPath(p, r)
              paths.push(plan)
              reportedPaths.add(p)
            }

            // Reconciliation: ensure every requested path got classified.
            for (const p of parsed.syncPaths) {
              if (!reportedPaths.has(p)) {
                paths.push({ path: p, status: "failed", reason: "path was not classified (internal bug)" })
              }
            }

            const result: PlanResult = {
              manifest_version: parsed.version,
              last_version: lastVersion,
              paths,
              delete_paths: lastVersion === undefined ? [] : parsed.deletePaths,
              ...(lastVersion === undefined && parsed.deletePaths.length > 0
                ? { delete_skipped_first_run: true }
                : {}),
            }
            return JSON.stringify(result)
          } catch (err) {
            await logErr(client, "sync_configs_plan failed", err)
            return JSON.stringify({ error: `sync_configs_plan failed: ${formatErr(err)}` })
          }
        },
      }),

      sync_configs_apply: tool({
        description:
          "Internal — invoked only by the /sync-configs slash command. Do not call autonomously. " +
          "Applies a previously-planned sync. Re-fetches the upstream manifest first and aborts if " +
          "the version no longer matches `manifest_version` (defensive — closes the plan→apply race). " +
          "Then re-fetches every path in `paths_to_update` and every 'drop' decision, writes them, " +
          "applies 'custom' decisions verbatim, treats 'preserve' as a no-op, deletes `delete_paths`, " +
          "and persists the version only when nothing failed and every needs-user-decision path was " +
          "resolved. Returns a structured report.",
        args: {
          manifest_version: tool.schema
            .number()
            .int()
            .nonnegative()
            .describe("The version returned by sync_configs_plan. Apply refetches the manifest and aborts if upstream has moved."),
          paths_to_update: tool.schema
            .array(tool.schema.string())
            .describe(
              "Every path the plan classified as 'updated'. Apply re-fetches each from upstream and writes the body. Pass plain path strings.",
            ),
          decisions: tool.schema
            .array(
              tool.schema.discriminatedUnion("action", [
                tool.schema.object({
                  path: tool.schema.string(),
                  action: tool.schema.literal("preserve"),
                }),
                tool.schema.object({
                  path: tool.schema.string(),
                  action: tool.schema.literal("drop"),
                }),
                tool.schema.object({
                  path: tool.schema.string(),
                  action: tool.schema.literal("custom"),
                  content: tool.schema.string().describe("Hand-merged content to write."),
                }),
              ]),
            )
            .describe(
              "User decisions for needs-user-decision paths. 'preserve' is a no-op; 'drop' triggers an upstream re-fetch; 'custom' writes the supplied content. Omit a path to leave the run unresolved (version will not advance).",
            ),
          unresolved: tool.schema
            .array(tool.schema.string())
            .describe(
              "Needs-user-decision paths the user explicitly left unresolved (e.g. skipped). These are listed in the report and block version advance.",
            ),
          delete_paths: tool.schema
            .array(tool.schema.string())
            .describe(
              "Paths to delete locally. Caller passes plan.delete_paths. On first-run (last_version was undefined) the plan returns this empty.",
            ),
          failed: tool.schema
            .array(
              tool.schema.object({
                path: tool.schema.string(),
                reason: tool.schema.string(),
              }),
            )
            .describe(
              "Paths the plan classified as 'failed'. Pass through verbatim so they appear in the report and block version advance.",
            ),
        },
        async execute(args) {
          try {
            showToast(client, "applying sync")

            // Manifest version assertion — guards the plan→apply race so a
            // user reviewing drift can't accidentally apply a newer upstream.
            const manifestFetch = await fetchUpstream(MANIFEST_PATH)
            if (!manifestFetch.ok) {
              return JSON.stringify({ error: `manifest re-fetch failed: ${manifestFetch.reason}` })
            }
            const parsedManifest = parseManifest(manifestFetch.body)
            if ("error" in parsedManifest) {
              return JSON.stringify({ error: parsedManifest.error })
            }
            if (parsedManifest.version !== args.manifest_version) {
              return JSON.stringify({
                error: `manifest version changed between plan and apply (was ${args.manifest_version}, now ${parsedManifest.version}) — re-run /sync-configs`,
              })
            }

            const updated: string[] = []
            const preserved: string[] = []
            const failed: { path: string; reason: string }[] = [...args.failed]

            // Coalesce `paths_to_update` and `drop` decisions into one parallel
            // re-fetch — same write semantics for both ("write upstream body").
            const dropPaths = args.decisions
              .filter((d): d is { path: string; action: "drop" } => d.action === "drop")
              .map((d) => d.path)
            const pathsToFetch = [...args.paths_to_update, ...dropPaths]

            const fetchResults = await Promise.all(
              pathsToFetch.map(async (p) => ({ p, r: await fetchUpstream(p) })),
            )

            for (const { p, r } of fetchResults) {
              if (!r.ok) {
                failed.push({ path: p, reason: `fetch failed: ${r.reason}` })
                continue
              }
              try {
                await writeFileEnsuringDir(p, r.body)
                updated.push(p)
              } catch (err) {
                failed.push({ path: p, reason: `write failed: ${formatErr(err)}` })
              }
            }

            for (const d of args.decisions) {
              if (d.action === "preserve") {
                // Pure no-op: the local file is already what the user wants.
                preserved.push(d.path)
                continue
              }
              if (d.action === "custom") {
                try {
                  await writeFileEnsuringDir(d.path, d.content)
                  updated.push(d.path)
                } catch (err) {
                  failed.push({ path: d.path, reason: `custom-write failed: ${formatErr(err)}` })
                }
                continue
              }
              // 'drop' was already handled in the parallel fetch loop above.
            }

            const deleted: string[] = []
            for (const p of args.delete_paths) {
              if (!existsSync(p)) continue
              try {
                await unlink(p)
                deleted.push(p)
              } catch (err) {
                failed.push({ path: p, reason: `delete failed: ${formatErr(err)}` })
              }
            }

            const versionShouldAdvance = failed.length === 0 && args.unresolved.length === 0

            if (versionShouldAdvance) {
              await writeLocalVersion(projectName, args.manifest_version)
            }

            const pluginSelfUpdated = updated.includes(PLUGIN_SELF_PATH)

            const result: ApplyResult = {
              version: args.manifest_version,
              updated,
              preserved,
              deleted,
              failed,
              unresolved: args.unresolved,
              version_advanced: versionShouldAdvance,
              plugin_self_updated: pluginSelfUpdated,
            }
            return JSON.stringify(result)
          } catch (err) {
            await logErr(client, "sync_configs_apply failed", err)
            return JSON.stringify({ error: `sync_configs_apply failed: ${formatErr(err)}` })
          }
        },
      }),
    },
  }
}

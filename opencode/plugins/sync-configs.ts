// Sync-configs plugin — fetches OpenCode config files from upstream GitHub
// into the local install. Implements the mechanical work of /sync-configs as
// two tools: sync_configs_plan (read-only diagnosis) and sync_configs_apply
// (mutating commit). The /sync-configs slash command orchestrates them and
// surfaces user decisions for non-allowlisted drift.
//
// State: ~/.opencode-data/sync-configs/<project>/version contains the
// last-synced manifest version integer for this project. No format, no
// schema. Sibling subtree to artifacts/ and memory/ so cleanup tooling for
// one cannot reach the others.
//
// HTTP: native fetch (Node 18+); no curl, no SDK calls. opencode.jsonc is
// always deferred to the user when it differs — no JSONC merge logic in
// this plugin.

import { type Plugin, type PluginInput, tool } from "@opencode-ai/plugin"
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import { formatErr, SYNC_CONFIGS_ROOT } from "./lib/project"

type Client = PluginInput["client"]

const BASE_URL =
  "https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/"
const MANIFEST_PATH = ".opencode/sync-configs-manifest.md"
const PLUGIN_SELF_PATH = "plugins/sync-configs.ts"
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

const parseManifest = (body: string): ParsedManifest | { error: string } => {
  let version: number | undefined
  const syncPaths: string[] = []
  const deletePaths: string[] = []
  let inDeleted = false

  for (const line of body.split(/\r?\n/)) {
    const versionMatch = /^Version:\s*(\d+)\s*$/.exec(line)
    if (versionMatch) {
      version = Number(versionMatch[1])
      continue
    }
    const headerMatch = /^##\s+(.*\S)\s*$/.exec(line)
    if (headerMatch) {
      inDeleted = headerMatch[1].toLowerCase() === "deleted"
      continue
    }
    const pathMatch = /^-\s+(\S+)\s*$/.exec(line)
    if (pathMatch) {
      const p = pathMatch[1]
      if (inDeleted) deletePaths.push(p)
      else syncPaths.push(p)
    }
  }

  if (version === undefined) {
    return { error: "manifest missing 'Version: <integer>' line" }
  }
  return { version, syncPaths, deletePaths }
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
  | { path: string; status: "updated"; remote: string }
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
    return { path, status: "updated", remote }
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
    return { path, status: "updated", remote }
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
          "delete_paths }. Writes nothing. Status values: 'unchanged', 'updated' (write remote verbatim), " +
          "'needs-user-decision' (caller must collect preserve/drop/custom and pass to sync_configs_apply), " +
          "'failed' (with reason). When manifest_version equals last_version, returns short_circuit.",
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
          "Applies a previously-planned sync. Writes 'updated' paths verbatim from `paths_to_update`, " +
          "applies each `decision` for needs-user-decision paths, deletes `delete_paths`, and persists " +
          "the version only when nothing failed and every needs-user-decision path has a matching decision. " +
          "Returns a structured report. The caller (the slash command) is responsible for re-running plan " +
          "and validating that every needs-user-decision case has a corresponding decision before calling apply.",
        args: {
          manifest_version: tool.schema
            .number()
            .int()
            .nonnegative()
            .describe("The version returned by sync_configs_plan. Must match what plan saw."),
          paths_to_update: tool.schema
            .array(
              tool.schema.object({
                path: tool.schema.string(),
                content: tool.schema.string(),
              }),
            )
            .describe(
              "Every path the plan classified as 'updated' (write remote verbatim). Caller passes the remote content from the plan.",
            ),
          decisions: tool.schema
            .array(
              tool.schema.discriminatedUnion("action", [
                tool.schema.object({
                  path: tool.schema.string(),
                  action: tool.schema.literal("preserve"),
                  content: tool.schema.string().describe("The local content to keep verbatim."),
                }),
                tool.schema.object({
                  path: tool.schema.string(),
                  action: tool.schema.literal("drop"),
                  content: tool.schema.string().describe("The remote content to write."),
                }),
                tool.schema.object({
                  path: tool.schema.string(),
                  action: tool.schema.literal("custom"),
                  content: tool.schema.string().describe("Hand-merged content to write."),
                }),
              ]),
            )
            .describe(
              "User decisions for needs-user-decision paths. Omit a path to leave the run unresolved (version will not advance).",
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

            const updated: string[] = []
            const preserved: string[] = []
            const failed: { path: string; reason: string }[] = [...args.failed]

            for (const u of args.paths_to_update) {
              try {
                await writeFileEnsuringDir(u.path, u.content)
                updated.push(u.path)
              } catch (err) {
                failed.push({ path: u.path, reason: `write failed: ${formatErr(err)}` })
              }
            }

            for (const d of args.decisions) {
              try {
                if (d.action === "preserve") {
                  // Local content is already what we want — verify on disk, but no write needed.
                  // If the local file was somehow removed between plan and apply, write the preserved content back.
                  if (!existsSync(d.path)) {
                    await writeFileEnsuringDir(d.path, d.content)
                  } else {
                    const onDisk = await readFile(d.path, "utf8")
                    if (onDisk !== d.content) {
                      await writeFileEnsuringDir(d.path, d.content)
                    }
                  }
                  preserved.push(d.path)
                } else {
                  // 'drop' or 'custom' — write the supplied content.
                  await writeFileEnsuringDir(d.path, d.content)
                  updated.push(d.path)
                }
              } catch (err) {
                failed.push({ path: d.path, reason: `decision-apply failed: ${formatErr(err)}` })
              }
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

// Sync-configs plugin — thin metadata + helper surface for /sync-configs.
//
// The /sync-configs slash command orchestrates the sync loop using the
// agent's built-in Read/Write/Bash tools. This plugin provides four small
// helpers the agent leans on:
//
//   sync_configs_get_manifest  — fetch and parse the upstream manifest;
//                                also returns the local last-synced version.
//   sync_configs_fetch_file    — fetch one upstream file by manifest-relative
//                                path; one call per path keeps tool results small.
//   sync_configs_classify      — pure function (local, remote) → status; keeps
//                                the deterministic line-set drift detection in
//                                code, away from LLM fuzziness.
//   sync_configs_record_version — persist the manifest version to local state
//                                after a successful sync.
//
// Path resolution is deliberately the agent's responsibility — manifest paths
// are fed into Read/Write at whatever configs-root the user's AGENTS.md points
// at. The plugin never sees that root, so the same plugin works whether
// OpenCode runs at the configs dir or one level above it.
//
// State: ~/.opencode-data/sync-configs/<project>/version, where <project> =
// basename(PluginInput.project.worktree). Sibling subtree to artifacts/ and
// memory/.
//
// HTTP: native fetch (Node 18+). opencode.jsonc is hard-coded as always-defer
// inside `classify` so the slash command never has to special-case it.

import { type Plugin, type PluginInput, tool } from "@opencode-ai/plugin"
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { basename, join } from "node:path"

type Client = PluginInput["client"]

const formatErr = (err: unknown): string =>
  err instanceof Error ? err.message : String(err)

const SYNC_CONFIGS_ROOT = join(homedir(), ".opencode-data", "sync-configs")

const BASE_URL =
  "https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/"
const MANIFEST_PATH = ".opencode/sync-configs-manifest.json"
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
  paths: Record<string, string[]>
  deleted: string[]
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
  const paths: Record<string, string[]> = {}
  for (const [key, val] of Object.entries(obj.paths as Record<string, unknown>)) {
    if (!isStringArray(val)) {
      return { error: `manifest 'paths.${key}' must be a string array` }
    }
    paths[key] = val
  }
  if (!isStringArray(obj.deleted ?? [])) {
    return { error: "manifest 'deleted' must be a string array" }
  }
  const deleted = (obj.deleted as string[] | undefined) ?? []
  return { version: obj.version, paths, deleted }
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
      sync_configs_get_manifest: tool({
        description:
          "Internal — invoked only by the /sync-configs slash command. Do not call autonomously. " +
          "Fetches the upstream manifest, parses it, and reads the local last-synced version state. " +
          "Returns { version, paths, deleted, last_local_version, short_circuit? }. When `short_circuit` " +
          "is true, manifest version equals the local version and the slash command should exit early. " +
          "`paths` is an object whose values are string arrays per category — flatten with " +
          "Object.values(paths).flat() to get the full sync list. Manifest paths are upstream-relative " +
          "(e.g. 'agents/lead.md', '.opencode/plugins/sync-configs.ts'); the slash command resolves " +
          "them under whatever configs-root the user's AGENTS.md or cwd designates.",
        args: {},
        async execute() {
          try {
            showToast(client, "fetching manifest")

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

            const lastLocalVersion = await readLocalVersion(projectName)

            return JSON.stringify({
              version: parsed.version,
              paths: parsed.paths,
              deleted: parsed.deleted,
              last_local_version: lastLocalVersion,
              short_circuit: lastLocalVersion !== undefined && lastLocalVersion === parsed.version,
            })
          } catch (err) {
            await logErr(client, "sync_configs_get_manifest failed", err)
            return JSON.stringify({ error: `sync_configs_get_manifest failed: ${formatErr(err)}` })
          }
        },
      }),

      sync_configs_fetch_file: tool({
        description:
          "Internal — invoked only by the /sync-configs slash command. Do not call autonomously. " +
          "Fetches one upstream file by manifest-relative path. Returns { ok: true, body } or " +
          "{ ok: false, reason }. Used by the slash command's per-path loop after sync_configs_get_manifest. " +
          "The path is upstream-relative (the same string as appears in manifest.paths arrays); the " +
          "plugin appends it to the upstream BASE_URL. Does not touch local files — the slash command " +
          "uses the agent's Write tool with whatever configs-root path resolution it needs.",
        args: {
          path: tool.schema
            .string()
            .describe("Manifest-relative path (e.g. 'agents/lead.md'). Upstream-relative; the plugin appends BASE_URL itself."),
        },
        async execute(args) {
          try {
            const r = await fetchUpstream(args.path)
            return JSON.stringify(r)
          } catch (err) {
            await logErr(client, "sync_configs_fetch_file failed", err)
            return JSON.stringify({ ok: false, reason: `sync_configs_fetch_file failed: ${formatErr(err)}` })
          }
        },
      }),

      sync_configs_classify: tool({
        description:
          "Internal — invoked only by the /sync-configs slash command. Do not call autonomously. " +
          "Pure function: compares a local file body and an upstream remote body and returns the " +
          "sync action the slash command should take. Returns one of: { status: 'unchanged' }, " +
          "{ status: 'updated' } (remote is a strict line-set superset — applying remote drops " +
          "nothing the user added), or { status: 'needs-user-decision', local_only_lines: string[], " +
          "reason: string } (local has lines absent from upstream — drift). The 'always-defer' set " +
          "(currently just opencode.jsonc) is hard-coded to return needs-user-decision regardless of " +
          "subset analysis. Output is tiny — just status + line metadata, never bodies.",
        args: {
          path: tool.schema
            .string()
            .describe("Manifest-relative path. Used to apply the always-defer set."),
          local: tool.schema
            .string()
            .describe("Local file body."),
          remote: tool.schema
            .string()
            .describe("Upstream file body (typically from sync_configs_fetch_file)."),
        },
        async execute(args) {
          try {
            if (args.local === args.remote) {
              return JSON.stringify({ status: "unchanged" })
            }
            const drift = localOnlyLines(args.local, args.remote)
            if (ALWAYS_DEFER_PATHS.has(args.path)) {
              return JSON.stringify({
                status: "needs-user-decision",
                local_only_lines: drift,
                reason: "always-defer file (manual permission/customization expected)",
              })
            }
            if (drift.length === 0) {
              return JSON.stringify({ status: "updated" })
            }
            return JSON.stringify({
              status: "needs-user-decision",
              local_only_lines: drift,
              reason: "local has lines not present upstream (drift)",
            })
          } catch (err) {
            await logErr(client, "sync_configs_classify failed", err)
            return JSON.stringify({ error: `sync_configs_classify failed: ${formatErr(err)}` })
          }
        },
      }),

      sync_configs_record_version: tool({
        description:
          "Internal — invoked only by the /sync-configs slash command. Do not call autonomously. " +
          "Persists the manifest version to local state at " +
          "~/.opencode-data/sync-configs/<project>/version (project = basename(worktree)). The slash " +
          "command calls this only after a fully successful sync — no failures, no unresolved " +
          "needs-user-decision paths. Partial-failure runs leave the state untouched so the next " +
          "/sync-configs re-enters and retries. Returns { ok: true } or { ok: false, reason }.",
        args: {
          version: tool.schema
            .number()
            .int()
            .nonnegative()
            .describe("Manifest version to persist. Should be the value from sync_configs_get_manifest."),
        },
        async execute(args) {
          try {
            showToast(client, `recording version ${args.version}`)
            await writeLocalVersion(projectName, args.version)
            return JSON.stringify({ ok: true })
          } catch (err) {
            await logErr(client, "sync_configs_record_version failed", err)
            return JSON.stringify({ ok: false, reason: `sync_configs_record_version failed: ${formatErr(err)}` })
          }
        },
      }),
    },
  }
}

// instructions-base plugin — writes the OpenCode config directory's absolute,
// forward-slash path to <configdir>/.config-dir on every session start.
//
// opencode.jsonc references this file via `{file:.config-dir}` substitution to
// compose absolute paths into the `instructions` array. Absolute paths are
// required because OpenCode resolves relative `instructions` entries against
// the running session's cwd (worktree), not the config dir, so a session
// launched outside the config dir would otherwise miss the rule files.
//
// Forward slashes only, because Windows backslashes from `OPENCODE_CONFIG_DIR`
// produce invalid JSON escape sequences when interpolated into the config text
// pre-parse.

import { type Plugin } from "@opencode-ai/plugin"
import { writeFile, rename, unlink } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const SENTINEL = ".config-dir"

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

const formatErr = (err: unknown): string =>
  err instanceof Error ? err.message : String(err)

export const InstructionsBasePlugin: Plugin = async ({ client }) => {
  try {
    const pluginDir = dirname(fileURLToPath(import.meta.url))
    const configDir = dirname(pluginDir)
    const body = configDir.replaceAll("\\", "/")
    await atomicReplace(join(configDir, SENTINEL), body)
  } catch (err) {
    try {
      await client.app.log({
        body: {
          service: "plugin/instructions-base",
          level: "error",
          message: `write failed: ${formatErr(err)}`,
        },
      })
    } catch {
      console.error("[plugin/instructions-base] write failed:", err)
    }
  }

  return {}
}

export default InstructionsBasePlugin

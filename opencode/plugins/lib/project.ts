// Shared helpers for plugins that persist under ~/.opencode-data/.
// artifacts.ts, memory.ts, and sync-configs.ts use these; keep behavior consistent.
//
// Layout under the single top-level data root:
//   ~/.opencode-data/artifacts/<project>/<command>.md      (artifacts.ts)
//   ~/.opencode-data/memory/<project>/{rules,facts}.txt    (memory.ts)
//   ~/.opencode-data/sync-configs/<project>/version        (sync-configs.ts)
// Each plugin's storage lives in its own subtree so cleanup tooling for one
// cannot reach into another.
//
// Project name is `basename(PluginInput.project.worktree)` — OpenCode resolves
// `worktree` for us (walks up to a VCS root, falls back to the launch dir for
// non-git workdirs), so plugins never need to spawn git themselves.

import { rmdir, unlink } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

const DATA_ROOT = join(homedir(), ".opencode-data")
export const ARTIFACT_ROOT = join(DATA_ROOT, "artifacts")
export const MEMORY_ROOT = join(DATA_ROOT, "memory")
export const SYNC_CONFIGS_ROOT = join(DATA_ROOT, "sync-configs")

export const removeEmptyDir = async (dir: string): Promise<void> => {
  try {
    await rmdir(dir)
  } catch {
    // not empty or already gone — ignore
  }
}

export type DeleteResult = { deleted: string[]; skipped: string[] }

export const formatErr = (err: unknown): string =>
  err instanceof Error ? err.message : String(err)

export const deleteFile = async (path: string, result: DeleteResult): Promise<void> => {
  try {
    await unlink(path)
    result.deleted.push(path)
  } catch {
    result.skipped.push(path)
  }
}

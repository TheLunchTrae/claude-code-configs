// Shared helpers for plugins that persist under ~/.opencode-data/.
// Both artifacts.ts and memory.ts use these; keep behavior consistent across both.
//
// Layout under the single top-level data root:
//   ~/.opencode-data/artifacts/<project>/<command>.md   (artifacts.ts)
//   ~/.opencode-data/memory/<project>/{rules,facts}.txt (memory.ts)
// Memory and artifacts live in separate subtrees so cleanup tooling for one
// can never reach into the other.
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

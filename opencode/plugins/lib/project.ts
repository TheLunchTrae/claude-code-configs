// Shared helpers for plugins that persist under ~/.opencode-data/.
// Both artifacts.ts and memory.ts use these; keep behavior consistent across both.
//
// Layout under the single top-level data root:
//   ~/.opencode-data/artifacts/<project>/<command>.md   (artifacts.ts)
//   ~/.opencode-data/memory/<project>/{rules,facts}.txt (memory.ts)
// Memory and artifacts live in separate subtrees so cleanup tooling for one
// can never reach into the other.

import type { PluginInput } from "@opencode-ai/plugin"
import { rmdir, unlink } from "node:fs/promises"
import { homedir } from "node:os"
import { basename, join } from "node:path"

// `PluginInput.project` is a `Project` from the OpenCode SDK. It carries
// `worktree` and `vcs` so we can skip `git rev-parse --show-toplevel` entirely
// and skip `git config --get remote.origin.url` outside git repos. The Project
// type does not include a human-readable name — only an opaque `id` — so the
// remote-URL → repo-name fallback still has to run inside git repos.

const DATA_ROOT = join(homedir(), ".opencode-data")
export const ARTIFACT_ROOT = join(DATA_ROOT, "artifacts")
export const MEMORY_ROOT = join(DATA_ROOT, "memory")

export const projectNameFromRemoteUrl = (url: string): string | undefined => {
  const trimmed = url.trim().replace(/\.git$/, "")
  if (!trimmed) return undefined
  const last = trimmed.split(/[\/:]/).pop()
  return last || undefined
}

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

export const makeResolveProject = ({
  $,
  project,
}: Pick<PluginInput, "$" | "project">): (() => Promise<string>) => {
  let cached: string | undefined
  return async () => {
    if (cached) return cached
    if (project.vcs === "git") {
      try {
        const remote = (
          await $`git -C ${project.worktree} config --get remote.origin.url`.quiet().nothrow().text()
        ).trim()
        const fromRemote = projectNameFromRemoteUrl(remote)
        if (fromRemote) return (cached = fromRemote)
      } catch {
        // fall through to worktree basename
      }
    }
    return (cached = basename(project.worktree))
  }
}

// Shared helpers for plugins that persist under ~/.opencode-artifacts/<project>/.
// Both artifacts.ts and memory.ts use these; keep behavior consistent across both.

import type { PluginInput } from "@opencode-ai/plugin"
import { rmdir, unlink } from "node:fs/promises"
import { homedir } from "node:os"
import { basename, join } from "node:path"

export const ARTIFACT_ROOT = join(homedir(), ".opencode-artifacts")

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
  directory,
}: Pick<PluginInput, "$" | "directory">): (() => Promise<string>) => {
  let cached: string | undefined
  return async () => {
    if (cached) return cached
    try {
      const remote = (await $`git -C ${directory} config --get remote.origin.url`.quiet().nothrow().text()).trim()
      const fromRemote = projectNameFromRemoteUrl(remote)
      if (fromRemote) return (cached = fromRemote)
    } catch {
      // fall through
    }
    try {
      const top = (await $`git -C ${directory} rev-parse --show-toplevel`.quiet().nothrow().text()).trim()
      if (top) return (cached = basename(top))
    } catch {
      // fall through
    }
    return (cached = basename(directory))
  }
}

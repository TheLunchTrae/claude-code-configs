---
description: "Sync OpenCode config files (agents, commands, skills, plugins) from the upstream GitHub repo. Use to pull config updates after a version bump."
---

Sync OpenCode config files from the upstream GitHub repo into this project directory.

Base URL: `https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/`
Local base: `.` (project root — the directory containing this `.opencode/` folder)
State file: `~/.opencode-artifacts/_global/sync-configs/last-version.txt` — a single line holding the last-synced manifest version integer.

The list of files to sync lives in a separate manifest fetched from upstream on every run: `<Base URL>.opencode/sync-configs-manifest.md`. The local manifest is never consulted — the command is strictly upstream-driven.

## Sync procedure

1. **Fetch the manifest** via `curl` from `<Base URL>.opencode/sync-configs-manifest.md`.
   - If the fetch fails (non-200 or network error), print a single clear message — `/sync-configs aborted: could not fetch manifest from <URL>. Check network or URL and retry.` — and exit. Do not touch any local file; do not fetch any other files; do not write the state file.

2. **Parse the manifest:**
   - Extract the manifest version from the line matching `^Version:\s*(\d+)$` → `remote_version`.
   - Track which section you are currently inside by watching for `^## ` headers.
   - Collect every path from lines matching `^- (\S+)`. Paths under `## Deleted` go into `delete_paths`; paths under every other section go into `sync_paths`.

3. **Read the state file** at `~/.opencode-artifacts/_global/sync-configs/last-version.txt`:
   - If the file exists and parses as an integer → `last_version`.
   - If it is missing, empty, or unparseable → `last_version = null`.

4. **Short-circuit.** If `last_version == remote_version`, print `Already up to date (version <N>).` and exit. Do not fetch any file content; do not modify the state file.

5. **Sync each path in `sync_paths`.** Split `sync_paths` into batches of ~5 paths each and dispatch one subagent per batch via the Task tool, running all batches in parallel. Each subagent performs steps 5.1–5.3 on its assigned paths (fetch, compare, merge when different) and returns a structured result per path: updated, unchanged, needs-user-decision, or failed. Single ownership per artifact — no two subagents touch the same path. The primary consolidates the results from all batches, handles the needs-user-decision cases centrally (see step 5.3), and only then proceeds to step 6.
   1. **Fetch** the remote file via `curl` to `<Base URL><path>`. If the fetch fails, skip the file and add it to the failures list — do not abort the whole run or the batch.
   2. **Compare** the fetched content to the local file at `<path>`:
      - **Identical** — skip, add to unchanged list.
      - **Local file missing** — write the remote content directly, add to updated list.
      - **Different** — proceed to the merge step.
   3. **Merge** when content differs:
      - Prefer remote content as the base.
      - Scan the local file for sections, lines, or blocks absent from the remote. For each local-only addition, judge intent:
        - **Preserve** if the addition is clearly a local customization (environment-specific tool references, local paths, workspace-specific notes).
        - **Drop** if it appears to be content the remote has since removed or superseded.
      - If the diff is large, touches core workflow behavior, or the intent of a local addition is ambiguous, **defer the write and return the file as needs-user-decision** with a brief summary of what differs. Do not write the file from inside the subagent — the primary surfaces these after all batches report back, asks the user, and writes each one based on their instruction.
      - Once the merged content is determined (either inside the subagent for clear-cut merges, or by the primary after user confirmation), write the file and add it to the updated list.

6. **Apply deletions from `delete_paths`** — **only if `last_version != null`.**
   - For each path, if the local file exists, delete it and add it to the deleted list. If it does not exist, silently skip it.
   - If `last_version == null` (first run, or the user cleared the state file), do not delete anything. Count the entries and surface a single note in the report: `Skipped N deletion(s) — no prior sync state, cannot prove these files came from a previous sync.`

7. **Write the state file** with `remote_version`, unconditionally after the sync attempt completes (even if some files failed to fetch). Create `~/.opencode-artifacts/_global/sync-configs/` if it does not exist. The state file is only left untouched when the run aborts at step 1 or short-circuits at step 4.

8. **Print the final report:**

```
## Sync complete (version <remote_version>)

**Updated** (N):
- path/to/file.md

**Unchanged** (N):
- path/to/file.md

**Deleted** (N):
- path/to/old-file.md

**Failed to fetch** (N):
- path/to/file.md — <reason>
```

Omit any section whose count is zero. Append the skipped-deletions note from step 6 below the report when it applies.

## Notes

- `opencode.jsonc` contains local permission customizations. Treat any change to the `permission` block as potentially significant and ask the user before applying it.
- After any change under `plugins/` or to `tsconfig.json`, prompt the user to run `bun install` in the OpenCode config root so plugin dependencies (`@opencode-ai/plugin`, types) are resolved before the next session.
- This command file (`.opencode/commands/sync-configs.md`) is listed in the manifest, so its local copy is refreshed on every run. The manifest file itself (`.opencode/sync-configs-manifest.md`) is not listed — the command always fetches it fresh from upstream before reading entries, so the local copy is never consulted.
- Deleting `~/.opencode-artifacts/_global/sync-configs/last-version.txt` forces the next run to re-sync every tracked file from scratch, but deletions will be **skipped** on that run — the command cannot prove those files came from a previous sync. Deletions from the current manifest version will not be applied retroactively unless the upstream manifest bumps the version again.

$ARGUMENTS

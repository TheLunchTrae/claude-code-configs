---
description: "Sync OpenCode config files (agents, commands, skills, plugins) from the upstream GitHub repo. Use to pull config updates after a version bump."
---

**Execute this procedure now as tool calls.** This command is a runtime sync operation — not a specification to implement. Perform each numbered step directly using `curl`, file reads, and file writes; do not author code, plugins, or scripts that reproduce the procedure. Use `curl` (not `webfetch`) for the HTTP fetches — `webfetch` triggers a per-URL permission prompt that would fire dozens of times across the manifest, and its 5 MB response cap is a hard throw.

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

5. **Sync each path in `sync_paths`.** Split `sync_paths` into batches of ~5 paths each and dispatch one subagent per batch via the Task tool, running all batches in parallel. Each subagent performs steps 5.1–5.3 on its assigned paths (fetch, compare, merge when different) and returns a structured result per path: updated, unchanged, needs-user-decision, or failed. Single ownership per artifact — no two subagents touch the same path. The primary consolidates the results from all batches, handles the needs-user-decision cases centrally (see step 5.3), runs the reconciliation check in step 5.4, and only then proceeds to step 6.
   1. **Fetch** the remote file via `curl` to `<Base URL><path>`. Use `curl -fsSL` so non-2xx responses become errors instead of silently writing the response body. After the fetch, validate the response before treating it as authoritative — any of the following is a fetch failure (skip the file, add it to the failures list with the reason; do not abort the batch or the run):
      - `curl` exits non-zero, or the HTTP status is not 2xx.
      - The response body is empty or whitespace-only.
      - The first non-whitespace bytes of the body are `<!DOCTYPE html` or `<html` — GitHub serves an HTML 404 page in some failure modes that would otherwise overwrite a real local file with markup.
   2. **Compare** the fetched content to the local file at `<path>`:
      - **Identical** — skip, add to unchanged list.
      - **Local file missing** — write the remote content directly, add to updated list.
      - **Different** — proceed to the merge step.
   3. **Merge** when content differs. The default is to take the remote content verbatim; preserving local-only content is the exception, gated by an explicit allowlist rather than a heuristic judgment about intent.
      - Prefer remote content as the base.
      - Scan the local file for sections, lines, or blocks absent from the remote. For each local-only addition:
        - **Auto-preserve only when the path + region is on the allowlist below.** The allowlist is intentionally short:
          - `opencode.jsonc` — entries inside the `permission` block (matches the existing local-permissions note in the `## Notes` section).
        - **Everything else defers to the user.** Do not infer intent from prose patterns ("looks like a workspace note", "looks like an environment-specific path", "looks like a comment the user added"). That heuristic is the source of accidental drift retention. Return the file as **needs-user-decision** with a brief summary of the local-only content. Do not write the file from inside the subagent — the primary surfaces these after all batches report back, asks the user per file (preserve / drop / custom merge), and writes each one based on their instruction.
      - Once the merged content is determined (either inside the subagent for allowlisted-or-clean cases, or by the primary after user confirmation), write the file and add it to the updated list.
   4. **Reconcile.** After all batches return, the primary verifies that every path in `sync_paths` appears exactly once across the union of `updated`, `unchanged`, `needs-user-decision`, and `failed`. Any path missing from the union is added to the failures list with reason `subagent did not report this path`. This catches silent drops where a batch loses track of one of its assigned files.

6. **Apply deletions from `delete_paths`** — **only if `last_version != null`.**
   - For each path, if the local file exists, delete it and add it to the deleted list. If it does not exist, silently skip it.
   - If `last_version == null` (first run, or the user cleared the state file), do not delete anything. Count the entries and surface a single note in the report: `Skipped N deletion(s) — no prior sync state, cannot prove these files came from a previous sync.`

7. **Write the state file** with `remote_version` **only if the run is fully clean** — `failures` is empty AND every `needs-user-decision` case was resolved and written by the primary. If either condition fails, leave the state file untouched at its prior value (or absent) so the next `/sync-configs` re-enters the sync loop and retries. Already-current files cost only a fetch + an "Identical" comparison, so retries are cheap and self-healing. Create `~/.opencode-artifacts/_global/sync-configs/` if it does not exist when writing. The state file is left untouched when the run aborts at step 1, short-circuits at step 4, or ends step 5 with any path in the failures list or any unresolved needs-user-decision case.

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

Omit any section whose count is zero. Append the skipped-deletions note from step 6 below the report when it applies. When step 7 left the state file untouched (failures or unresolved needs-user-decision cases), append the line `State file not advanced — re-run /sync-configs to retry the failed paths.` so the user-visible outcome matches what actually happened on disk.

## Notes

- `opencode.jsonc` contains local permission customizations. Treat any change to the `permission` block as potentially significant and ask the user before applying it.
- The merge step in 5.3 only auto-preserves local-only content for paths and regions on its allowlist (currently just the `permission` block in `opencode.jsonc`). Every other local-only line, block, or section is treated as drift and surfaced to the user as `needs-user-decision` rather than silently kept. To extend the allowlist, edit step 5.3 in this command upstream and bump the manifest version.
- After any change under `plugins/` or to `tsconfig.json`, prompt the user to run `bun install` in the OpenCode config root so plugin dependencies (`@opencode-ai/plugin`, types) are resolved before the next session.
- This command file (`.opencode/commands/sync-configs.md`) is listed in the manifest, so its local copy is refreshed on every run. The manifest file itself (`.opencode/sync-configs-manifest.md`) is not listed — the command always fetches it fresh from upstream before reading entries, so the local copy is never consulted.
- A run that ends with any failed fetch or any unresolved `needs-user-decision` case intentionally does not advance the state file, so a follow-up `/sync-configs` will automatically retry the same manifest version without manual state-file deletion. Already-synced files in the retry are detected as `Identical` in step 5.2 and cost only a fetch + a comparison.
- Deleting `~/.opencode-artifacts/_global/sync-configs/last-version.txt` forces the next run to re-sync every tracked file from scratch, but deletions will be **skipped** on that run — the command cannot prove those files came from a previous sync. Deletions from the current manifest version will not be applied retroactively unless the upstream manifest bumps the version again.

$ARGUMENTS

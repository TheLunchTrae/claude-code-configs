Sync OpenCode config files from the upstream GitHub repo into this project directory.

Base URL: `https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/`
Local base: `.` (project root — the directory containing this `.opencode/` folder)

The list of files to sync lives in a separate manifest fetched from upstream on every run: `<Base URL>.opencode/sync-configs-manifest.md`. The local manifest is never consulted — the command is strictly upstream-driven.

## Sync procedure

1. **Fetch the manifest** via `curl` from `<Base URL>.opencode/sync-configs-manifest.md`.
   - If the fetch fails (non-200 or network error), print a single clear message — `/sync-configs aborted: could not fetch manifest from <URL>. Check network or URL and retry.` — and exit. Do not touch any local file; do not fetch any other files.

2. **Parse the manifest.** Collect every path from lines matching `^- (\S+)`. Ignore section headers, blank lines, and prose.

3. **Process each path** sequentially:
   1. **Fetch** the remote file via `curl` to `<Base URL><path>`. If the fetch fails, skip the file and add it to the failures list — do not abort the whole run.
   2. **Compare** the fetched content to the local file at `<path>`:
      - **Identical** — skip, add to unchanged list.
      - **Local file missing** — write the remote content directly, add to updated list.
      - **Different** — proceed to the merge step.
   3. **Merge** when content differs:
      - Prefer remote content as the base.
      - Scan the local file for sections, lines, or blocks absent from the remote. For each local-only addition, judge intent:
        - **Preserve** if the addition is clearly a local customization (environment-specific tool references, local paths, workspace-specific notes).
        - **Drop** if it appears to be content the remote has since removed or superseded.
      - If the diff is large, touches core workflow behavior, or the intent of a local addition is ambiguous, **pause and ask the user** before writing anything for that file. Show a brief summary of what differs. Wait for their instruction before continuing with that file.
      - Once the merged content is determined, write the file and add it to the updated list.

4. After all files are processed, print a final report:

```
## Sync complete

**Updated** (N):
- path/to/file.md

**Unchanged** (N):
- path/to/file.md

**Failed to fetch** (N):
- path/to/file.md — <reason>
```

Omit the failures section if there were none.

## Notes

- `opencode.jsonc` contains local permission customizations. Treat any change to the `permission` block as potentially significant and ask the user before applying it.
- After any change under `plugins/` or to `tsconfig.json`, prompt the user to run `bun install` in the OpenCode config root so plugin dependencies (`@opencode-ai/plugin`, types) are resolved before the next session.
- The manifest file itself (`.opencode/sync-configs-manifest.md`) and this command file (`.opencode/commands/sync-configs.md`) are listed in the manifest, so their local copies are also refreshed on every run.

$ARGUMENTS

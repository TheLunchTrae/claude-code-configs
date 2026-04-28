---
description: "Delete saved artifacts from ~/.opencode-artifacts"
---

Delete artifacts saved under `~/.opencode-artifacts/`.

Interpret `$ARGUMENTS` to determine scope:

- **No arguments** — all files under `~/.opencode-artifacts/`
- **One word matching a project directory** (e.g. `my-repo`) — all files under `~/.opencode-artifacts/my-repo/`
- **One word matching a command name** (e.g. `handoff`) — `handoff.md` inside every project directory
- **Two words** (e.g. `my-repo handoff`) — the single file `~/.opencode-artifacts/my-repo/handoff.md`

Steps:

1. Use `artifact_list` to enumerate what currently exists. If nothing is found, tell the user there is nothing to clean up and stop.

2. Determine scope from `$ARGUMENTS` using the rules above. When one word is given, check whether a subdirectory of that name exists under `~/.opencode-artifacts/` to identify it as a project; otherwise treat it as a command name.

3. Resolve the full list of files that would be deleted and display them to the user. Ask for confirmation before proceeding.

4. Upon confirmation, call `artifact_delete` with `confirm: true` and the appropriate `command` / `project` arguments per the scope rules above. Report the tool's summary of deleted and skipped paths back to the user.

**Fallback:** If the `artifacts` plugin failed to load and `artifact_list` / `artifact_delete` are unavailable, enumerate `*.md` files directly under `~/.opencode-artifacts/<project>/` via shell and delete with `rm`. Do not touch `memory/` subdirectories — those are managed by `memory_delete` and must survive artifact cleanup. Use `rmdir` (non-recursive) on the project directory afterward; it will correctly fail when `memory/` is present, leaving the project dir intact.

**Note on automatic pruning:** the plugin also runs a startup TTL pass that deletes artifacts older than 90 days (configurable via `OPENCODE_ARTIFACT_TTL_DAYS`; set to `0` to disable). This command exists for explicit, scoped cleanup that the TTL pass does not cover.

$ARGUMENTS

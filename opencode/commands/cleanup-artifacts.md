---
description: "Delete saved artifacts"
---

Delete saved artifacts via the `artifacts` plugin.

Interpret `$ARGUMENTS` to determine scope:

- **No arguments** — every artifact across every project.
- **One word matching a project name** (e.g. `my-repo`) — every artifact for that project.
- **One word matching a command name** (e.g. `handoff`) — that command's artifact across every project.
- **Two words** (e.g. `my-repo handoff`) — the single artifact for that project + command pair.

Steps:

1. Use `artifact_list` to enumerate what currently exists. If nothing is found, tell the user there is nothing to clean up and stop.

2. Determine scope from `$ARGUMENTS` using the rules above. When one word is given, treat it as a project name if `artifact_list`'s output shows a project of that name; otherwise treat it as a command name.

3. Display the full list of artifacts that would be deleted. Ask for confirmation before proceeding.

4. Upon confirmation, call `artifact_delete` with `confirm: true` and the appropriate `command` / `project` arguments per the scope rules above. Report the tool's summary of deleted and skipped paths back to the user.

**Fallback:** If the `artifacts` plugin failed to load and `artifact_list` / `artifact_delete` are unavailable, enumerate `*.md` files directly under `~/.opencode-data/artifacts/<project>/` via shell and delete with `rm`. Memory storage lives at the sibling `~/.opencode-data/memory/` subtree and is never reached from this command. Use `rmdir` (non-recursive) on emptied project directories afterward.

**Note on automatic pruning:** the plugin also runs a startup TTL pass that deletes artifacts older than 90 days (configurable via `OPENCODE_ARTIFACT_TTL_DAYS`; set to `0` to disable). This command exists for explicit, scoped cleanup that the TTL pass does not cover.

$ARGUMENTS

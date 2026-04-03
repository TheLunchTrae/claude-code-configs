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

1. Confirm `~/.opencode-artifacts/` exists. If it does not, tell the user there is nothing to clean up and stop.

2. Determine scope from `$ARGUMENTS` using the rules above. When one word is given, check whether a subdirectory of that name exists under `~/.opencode-artifacts/` to identify it as a project; otherwise treat it as a command name and find `<word>.md` in every project directory.

3. Resolve the full list of individual files that would be deleted and display them to the user. Ask for confirmation before proceeding.

4. Upon confirmation, delete each file individually with `rm <file>`. After all files are removed, clean up any empty directories left behind using `rmdir`.

5. Confirm what was deleted.

$ARGUMENTS

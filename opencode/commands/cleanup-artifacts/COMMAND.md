---
description: "Delete saved artifacts from ~/.opencode-artifacts"
---

Delete artifacts saved under `~/.opencode-artifacts/`.

Interpret `$ARGUMENTS` to determine scope:

- **No arguments** — delete everything: `rm -rf ~/.opencode-artifacts/*`
- **One word matching a command name** (e.g. `handoff`) — delete that command's directory: `rm -rf ~/.opencode-artifacts/<command>`
- **One word matching a project name** (e.g. `my-repo`) — delete that project's file from every command directory
- **Two words** (e.g. `handoff my-repo`) — delete that single file: `rm -f ~/.opencode-artifacts/<command>/<project>.md`

Steps:

1. Confirm `~/.opencode-artifacts/` exists. If it does not, tell the user there is nothing to clean up and stop.

2. Determine scope from `$ARGUMENTS` using the rules above. When one word is given, check whether it matches a subdirectory name under `~/.opencode-artifacts/` to distinguish a command name from a project name.

3. List what will be removed, then delete it.

4. Confirm what was deleted.

$ARGUMENTS

---
description: "Delete saved artifacts from ~/.opencode-artifacts"
---

Delete artifacts saved under `~/.opencode-artifacts/`.

Parse `$ARGUMENTS` to determine scope:

- **No arguments** — delete all artifacts: `rm -rf ~/.opencode-artifacts/*`
- **`--command <name>`** — delete artifacts for one command only: `rm -rf ~/.opencode-artifacts/<name>`
- **`--project <project>`** — delete the named project file from every command directory: find and remove all `~/.opencode-artifacts/*/<project>.md`
- **`--command <name> --project <project>`** — delete a single file: `rm -f ~/.opencode-artifacts/<name>/<project>.md`

Steps:

1. Parse `$ARGUMENTS` for `--command` and/or `--project` flags and their values.

2. Confirm `~/.opencode-artifacts/` exists. If it does not, tell the user there is nothing to clean up and stop.

3. Perform the deletion based on the scope determined above.
   - Before deleting, list what will be removed so the user can see what is being cleaned up.
   - Use `rm -rf` for directories, `rm -f` for individual files.

4. Report what was deleted and confirm the operation is complete.

**Argument examples:**

```
/cleanup-artifacts
/cleanup-artifacts --command handoff
/cleanup-artifacts --project my-repo
/cleanup-artifacts --command handoff --project my-repo
```

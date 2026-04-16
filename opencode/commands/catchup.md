---
description: "Resume context from the last session handoff"
---

Load the saved session summary for this project and orient for the next piece of work.

1. Read the handoff using the `artifact_read` tool: `artifact_read({ command: "handoff" })`. The plugin resolves the current project automatically. If the tool returns a not-found message, tell the user no handoff was found for this project and stop.

2. Summarize what was loaded back to the user: restate the active task in one sentence and the immediate next step. Do not just dump the file — synthesize it so the user can confirm we are picking up in the right place.

**Fallback:** If `artifact_read` is unavailable (the `artifacts` plugin failed to load), resolve the project via shell:
- `git remote get-url origin` → strip `.git` and take the last path segment, else `basename $(git rev-parse --show-toplevel)`, else `basename $PWD`.
- Read `~/.opencode-artifacts/<project>/handoff.md`. If absent, report and stop.

$ARGUMENTS

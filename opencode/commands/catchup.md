---
description: "Resume context from the last session handoff"
---

Load the saved session summary for this project and orient for the next piece of work.

1. Load the saved handoff for this project via the `artifact_read` tool (the saved slot is named "handoff"). The plugin resolves the current project automatically. If the tool returns a not-found message, tell the user no handoff was found for this project and stop.

2. Summarize what was loaded back to the user: restate the active task in one sentence and the immediate next step. Do not just dump the file — synthesize it so the user can confirm we are picking up in the right place.

If `artifact_read` is unavailable, stop and tell the user that the `artifacts` plugin appears unloaded — they should check their OpenCode plugin configuration. Do not fall back to direct file IO.

$ARGUMENTS

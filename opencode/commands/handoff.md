---
description: "Save a session summary to resume later"
---

Write a structured session summary so this context can be resumed in a future session.

1. Compose the summary using this exact structure:

```
## Session Memory — <today's date>

### Active task
One sentence describing what we are working on.

### Current state
What is done, what is in progress, and what is blocked.

### Key decisions made
Bullet list of non-obvious choices made this session and the rationale behind each.

### Next steps
Ordered list of what should happen next.

### Critical context
File paths, branch names, external constraints, environment quirks, or anything else needed to resume without re-discovering it.
```

2. Save the summary using the `artifact_write` tool: `artifact_write({ command: "handoff", content: <summary> })`. The plugin resolves the project, creates the directory, and overwrites any previous handoff. The tool's return value reports the path.

3. Confirm to the user that the handoff was saved and report the path returned by the tool.

If `artifact_write` is unavailable, stop and tell the user that the `artifacts` plugin appears unloaded — they should check their OpenCode plugin configuration. Do not fall back to direct file IO.

$ARGUMENTS

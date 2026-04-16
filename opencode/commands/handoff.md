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

2. Save the summary using the `artifact_write` tool: `artifact_write({ command: "handoff", content: <summary> })`. The plugin handles project resolution and directory creation. The artifact lands at `~/.opencode-artifacts/<project>/handoff.md`, overwriting any previous entry.

3. Confirm to the user that the handoff was saved and report the path returned by the tool.

**Fallback:** If `artifact_write` is unavailable (the `artifacts` plugin failed to load), fall back to shell:
- Resolve `<project>` via `git remote get-url origin` → strip `.git` and take the last path segment, else `basename $(git rev-parse --show-toplevel)`, else `basename $PWD`.
- `mkdir -p ~/.opencode-artifacts/<project>` and write the summary to `~/.opencode-artifacts/<project>/handoff.md`.

$ARGUMENTS

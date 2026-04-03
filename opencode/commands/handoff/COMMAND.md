---
description: "Save a session summary to resume later"
---

Write a structured session summary so this context can be resumed in a future session.

1. Determine the project name:
   - Try `git remote get-url origin` and extract the repository name (the last path segment, without `.git`)
   - If that fails, run `basename $(git rev-parse --show-toplevel)` to use the local repo directory name
   - If not in a git repo, run `basename $PWD`

2. Ensure the directory exists: `mkdir -p ~/.opencode-artifacts/<project>`

3. Write the summary to `~/.opencode-artifacts/<project>/handoff.md`, overwriting any previous entry. Use this exact structure:

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

4. Confirm to the user that the handoff was saved and where.

$ARGUMENTS

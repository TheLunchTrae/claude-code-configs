---
name: commit-push
description: "Stage, commit, and push changes"
---

Stage, commit, and push the current branch by running the commit skill followed by the push skill in sequence.

$ARGUMENTS

## Gotchas

- If the commit step fails (pre-commit hook, secret scan, no staged changes), the push step does not run. Don't assume both steps completed — verify with `git status` and `git log -1`.
- Inherits every gotcha from both `/commit` and `/push`.

---
description: "Stage, commit, and push changes"
---

Stage, commit, and push the current branch. Execute these two steps in order:

1. Load the `commit` skill and commit the changes.
2. Load the `push` skill and push the changes.

Do not skip step 1 or merge the steps — each skill carries its own pre-flight checks and failure modes that must run separately. If step 1 fails, stop and surface the failure; do not proceed to step 2.

$ARGUMENTS

## Gotchas

- If the commit step fails (pre-commit hook, secret scan, no staged changes), the push step does not run. Don't assume both steps completed — verify with `git status` and `git log -1`.
- Inherits every gotcha from both `/commit` and `/push`.

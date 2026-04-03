---
description: "Resume context from the last session handoff"
---

Load the saved session summary for this project and orient for the next piece of work.

1. Determine the project name using the same logic as `/handoff`:
   - Try `git remote get-url origin` and extract the repository name (the last path segment, without `.git`)
   - If that fails, run `basename $(git rev-parse --show-toplevel)`
   - If not in a git repo, run `basename $PWD`

2. Read `~/.opencode-artifacts/<project>/handoff.md`. If the file does not exist, tell the user no handoff was found for this project and stop.

3. Summarize what was loaded back to the user: restate the active task in one sentence and the immediate next step. Do not just dump the file — synthesize it so the user can confirm we are picking up in the right place.

$ARGUMENTS

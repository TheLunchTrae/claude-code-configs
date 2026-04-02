---
description: "Review code and present findings"
---

# Review: $ARGUMENTS

## Step 1: Determine review target
If $ARGUMENTS clearly specifies the target, use it:
- "mr" or "merge request" – current branch diff against the merge target
- "staged" – staged/cached changes only
- "local" – all uncommitted local changes
- A file path or glob – those specific files

If $ARGUMENTS is empty or unclear, ask the user which type of review they want before proceeding. Do not guess.

## Step 2: Gather the code

- MR: determine the target branch, run `git diff` against it
- Staged: run `git diff --cached`
- Local: all changes vs the latest commit
- Files: read the specified files directly

## Step 3: Review

Review the gathered code using your review methodology. Format the output according to [template.md](template.md).

## Step 4: Present findings

Present the findings grouped by severity. For each issue include the file, line, and description. Present the verdict clearly.

Stop here. The user will decide what to do next — if they want fixes applied, they will ask.

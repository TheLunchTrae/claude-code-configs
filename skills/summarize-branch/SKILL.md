---
name: summarize-branch
description: Summarize all changes on the current branch against its default/target branch, with purpose and concerns.
argument-hint: "[target branch or focus]"
---

Determine the repository's default/target branch (e.g. main, master, develop), then compare the
current branch against it. Use a branch named in the arguments instead when one is given.
Work read-only; report unavailable evidence.

Read changed files. Summarize changes, each change's purpose, and concerns or potential issues.
Group many changes by area or feature.

$ARGUMENTS

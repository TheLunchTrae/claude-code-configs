---
description: "Summarize all changes on the current branch"
disable-model-invocation: true
---

Determine the default/target branch for this repository (e.g. main,
master, develop), then compare the current branch against it.

Read the changed files and summarize:
- What has changed and the purpose of each change
- Any concerns or potential issues
- Group by area or feature if there are many changes

$ARGUMENTS

## Gotchas

- Assumes the current branch is up to date with its merge target. A stale branch produces a summary mixing the user's actual changes with merged-in commits from the target — rebase or merge first if accuracy matters.
- Uncommitted changes in the working tree are not included; the summary reflects committed state only.
- On long-lived branches, the summary may exceed a reasonable response length. Group aggressively and link out to file paths rather than quoting full diffs.

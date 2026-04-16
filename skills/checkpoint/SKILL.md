---
description: "Create or verify a named workflow checkpoint"
---

Create or verify a checkpoint in the current workflow.

## Usage

`/checkpoint [create|verify|list] [name]`

## Create

1. Run a quick sanity check on the current state (git status, any obvious blockers)
2. Create a git commit or stash tagged with the checkpoint name
3. Append a log entry to `.claude/checkpoints.log`:
   ```
   <date> | <name> | <git-sha>
   ```
4. Confirm checkpoint created

## Verify

Compare the current state against a named checkpoint:
- Files added or modified since the checkpoint
- Any regressions visible in git diff

Report:
```
CHECKPOINT: <name>
Files changed: N
Build: PASS/FAIL
Status: CLEAN / DIVERGED
```

## List

Show all checkpoints from `.claude/checkpoints.log` with name, timestamp, SHA, and whether the current HEAD is ahead/behind.

## Arguments

$ARGUMENTS

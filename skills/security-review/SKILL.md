---
description: Run a security review of current changes or specified files
agent: security-reviewer
context: fork
allowed-tools: Bash(git diff*), Bash(git log*), Bash(git status*), Bash(git grep*), Read, Grep, Glob
---

Invoke the security-reviewer agent to analyze code for vulnerabilities.

## Process

1. Determine the review target:
   - If the user specified files or a path, review those
   - If arguments look like a branch or commit, diff against that
   - Otherwise, review staged + unstaged changes (`git diff HEAD`)

2. Pass the target and any context to the security-reviewer agent

3. Present findings grouped by severity (CRITICAL → HIGH → MEDIUM)

4. If CRITICAL or HIGH issues are found, surface them prominently and note that they
   must be resolved before merging

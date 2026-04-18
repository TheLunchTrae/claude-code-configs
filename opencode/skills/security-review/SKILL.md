---
name: security-review
description: Run a security review of current changes or specified files
---

<!-- This skill is intended for subagent invocation. When invoking it programmatically, run it as a subtask for context isolation. -->

# Security review: $ARGUMENTS

Analyze code for vulnerabilities and present findings. Use when changes touch authentication, user input handling, database queries, cryptography, external APIs, or file I/O — anything with a plausible security blast radius.

## Process

1. Determine the review target:
   - If the user specified files or a path, review those
   - If arguments look like a branch or commit, diff against that
   - Otherwise, review staged + unstaged changes (`git diff HEAD`)

2. Review the target against OWASP Top 10 and common vulnerability patterns

3. Present findings grouped by severity (CRITICAL → HIGH → MEDIUM)

4. If CRITICAL or HIGH issues are found, surface them prominently and note that they must be resolved before merging

---
name: commit
description: "Stage and commit changes"
---

Stage and commit the specified changes. Follow these steps:

1. Run `git status` to review what is staged and unstaged.
2. If $ARGUMENTS specifies files or a scope, stage only those. Otherwise stage all relevant changes.
3. Run `git diff --cached` to review what will be committed. Scan for potential secrets or credentials — API keys, tokens, passwords, connection strings, private keys. If anything suspicious is found, stop and flag it to the user before proceeding.
4. Write a concise commit message focused on the "why" not the "what". Use a HEREDOC to pass it.
5. Commit and confirm success with `git status`.

Repository-level AGENTS.md instructions take precedence over these defaults.

$ARGUMENTS

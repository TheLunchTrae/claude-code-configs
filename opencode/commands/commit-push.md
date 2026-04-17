---
description: "Stage, commit, and push changes"
---

Stage, commit, and push the current branch.

## Stage and commit

1. Run `git status` to review what is staged and unstaged.
2. If $ARGUMENTS specifies files or a scope, stage only those. Otherwise stage all relevant changes.
3. Run `git diff --cached` to review what will be committed. Scan for potential secrets or credentials — API keys, tokens, passwords, connection strings, private keys. If anything suspicious is found, stop and flag it to the user before proceeding.
4. Write a concise commit message focused on the "why" not the "what". Use a HEREDOC to pass it.
5. Commit and confirm success with `git status`.

## Push

6. Run `git branch -vv` to check whether the current branch already tracks a remote branch.
7. Push:
   - If a tracking branch exists: `git push`
   - If no tracking branch: `git push -u origin <branch-name>`
8. If the push fails due to a network error, retry up to 3 times with brief pauses between attempts.
9. If the push is rejected (non-fast-forward), stop and report the situation to the user — do not force-push unless explicitly instructed.
10. Confirm success by reporting the remote URL and branch that was pushed to.

Repository-level AGENTS.md instructions take precedence over these defaults.

$ARGUMENTS

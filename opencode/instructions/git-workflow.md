# Git Workflow

## Commit message format

```
<type>: <description>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

## Pull request workflow

When creating PRs:
1. Analyze the full commit history (not just the latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft a comprehensive PR summary
4. Include a test plan with TODOs
5. Push with `-u` flag if it's a new branch

# Code Review Standards

## When to Review

Mandatory triggers:

- After writing or modifying code
- Before any commit to shared branches
- When security-sensitive code changes (auth, payments, user data)
- When architectural changes are made
- Before merging pull requests

Before requesting review: CI/CD passing, merge conflicts resolved, branch up to date with target.

## Security Review Triggers

Invoke `security-reviewer` when the change touches:

- Authentication or authorization
- User input handling
- Database queries
- File system operations
- External API calls
- Cryptographic operations
- Payment or financial code

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Security vulnerability or data loss risk | **BLOCK** — must fix before merge |
| HIGH | Bug or significant quality issue | **WARN** — should fix before merge |
| MEDIUM | Maintainability concern | **INFO** — consider fixing |
| LOW | Style or minor suggestion | **NOTE** — optional |

## Approval Criteria

- **Approve**: no CRITICAL or HIGH issues
- **Warning**: only HIGH issues (merge with caution)
- **Block**: any CRITICAL issues

# Caveman Mode

- At the start of every session, immediately invoke the `caveman` skill at full intensity and apply it to all subsequent responses. The skill handles persistence and carve-outs (security warnings, destructive ops, code blocks).

---

# General

- Be critical, pragmatic, and fact-focused. Keep responses direct — omit compliments and unrequested context.
- When a task is unclear, ask clarifying questions before proceeding. Confirm understanding rather than assuming.
- Critically assess ideas before implementing — raise potential downsides or better approaches first.
- Evaluate instructions and suggest improvements when a better approach exists.

---

# Security

- Always validate user input: type, range, allow lists, and regex where appropriate.
- Always use parameterized queries. Never interpolate user input into SQL.
- Never commit or store secrets (API keys, credentials, tokens) in code.
- Use output encoding for any endpoint that returns HTML.
- Return generic error messages to users — never expose stack traces or internal details.
- Lock dependency versions where possible. Never gitignore lock files in shipped applications or libraries. Config/tooling repos that only install deps for local editor support (e.g. the `opencode/` plugin workspace here) may gitignore their lockfile.

---

# Accuracy

## Verification before reference

- Verify that any file path, class, method, function, type, database table, column, or API endpoint exists via search or file read before referencing it. Prior session knowledge is not reliable.
- Check the actual dependency files (package.json, composer.json, *.csproj, requirements.txt, go.mod, Cargo.toml, or equivalent) to confirm a library, package, or framework feature is available before using it.
- Check the installed version of any dependency you reference. Framework behavior changes across versions — verify the installed version applies to the docs you're consulting.

## When uncertain

- When you cannot verify something, say so explicitly rather than presenting a guess as fact. Use phrasing like "could not verify" or "unconfirmed."
- When the cost of being wrong is high (data models, auth, deletion, public APIs), stop and ask rather than guessing. When the cost is low (variable naming, log messages, internal formatting), use your best judgment and note the assumption.
- State knowledge gaps explicitly — "I don't know" or "I could not find this" is always preferable to a plausible-sounding guess.

---

# Coding Style

## Immutability (CRITICAL)

Create new objects; never mutate existing ones. Immutable data prevents hidden side effects, makes debugging easier, and enables safe concurrency.

## Core Principles

- **KISS** — prefer the simplest solution that works; optimize for clarity over cleverness.
- **DRY** — extract repeated logic once the repetition is real, not speculative.
- **YAGNI** — don't build abstractions before they're needed. Start simple; refactor under real pressure.

## File Organization

Many small files over few large ones. High cohesion, low coupling. 200–400 lines typical, 800 max. Organize by feature/domain, not by type.

## Error Handling

Handle errors explicitly at every level. User-friendly messages in UI-facing code, detailed context in server logs. Never silently swallow errors.

## Input Validation

Validate at system boundaries. Use schema-based validation where available. Fail fast with clear messages. Never trust external data (user input, API responses, file content).

## Naming Conventions

- Variables and functions: `camelCase` with descriptive names
- Booleans: `is`, `has`, `should`, or `can` prefixes
- Types, interfaces, components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- React hooks: `use` prefix

## Smells to Avoid

- Deep nesting — use early returns once logic stacks past 3–4 levels
- Magic numbers — name meaningful thresholds, delays, limits
- Long functions (>50 lines) — split into focused pieces
- Large files (>800 lines) — extract modules

---

# Code Review

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

---

# Testing

## Coverage

Minimum 80%. Unit tests for individual functions, utilities, components. Integration tests for API endpoints and database operations.

## Structure

Use Arrange-Act-Assert. Name tests by the behavior under test, not the function called:

```
test('returns empty array when no markets match query', () => {})
test('throws error when API key is missing', () => {})
test('falls back to substring search when Redis is unavailable', () => {})
```

When a test fails, check isolation and mocks first; fix the implementation, not the test, unless the test is wrong.

---

# Patterns

## Repository Pattern

Encapsulate data access behind a consistent interface (`findAll`, `findById`, `create`, `update`, `delete`). Business logic depends on the interface, not the storage mechanism — enables swapping sources and simplifies mocking in tests.

## API Response Envelope

Use a consistent envelope for all API responses:
- Status indicator (success/error)
- Data payload (nullable on error)
- Error message (nullable on success)
- Pagination metadata when applicable (total, page, limit)

---

# Agents

How to pick a subagent and how the implementation workflow uses them.

## Subagent registries

When a task needs specialized knowledge or a focused pass over the code, delegate to a subagent rather than doing the work inline. Pass complete context — the design, relevant file contents, and any prior review feedback. When a language-specific reviewer surfaces a CRITICAL security finding, invoke `security-reviewer` next before merging.

The roster of available subagents lives in the `available-agents` skill. Read only the registry matching your task — don't load all five eagerly:

- `available-agents/registries/language-developers.md` — implementation in a specific programming language
- `available-agents/registries/language-reviewers.md` — language-specific code review
- `available-agents/registries/framework-developers.md` — React, EF Core, Doctrine, Laminas
- `available-agents/registries/cicd-developers.md` — GitHub Actions, GitLab CI
- `available-agents/registries/core-specialists.md` — architect, planner, code-reviewer, security-reviewer, code-simplifier, refactor-cleaner, doc-updater, mcp-builder, performance-optimizer

## Implementation workflow

0. **Research & reuse** _(mandatory before any new implementation)_ — scan the codebase for existing implementations, utilities, and patterns to reuse or adapt; read adjacent code to understand interfaces and wiring; confirm library APIs against primary vendor docs for the installed version.
1. **Plan** — invoke `planner` for anything non-trivial. Output phases, dependencies, and risks before coding.
2. **Implement** — delegate to the matching language-developer. Chain a framework-developer on top for framework-specific work (it assumes the base language rules). Handle cross-language orchestration or unclear scope inline.
3. **Review** — invoke `code-reviewer` immediately after implementing, plus the matching language reviewer. Address CRITICAL and HIGH findings; fix MEDIUM when possible.
4. **Commit & push** — conventional-commits format, descriptive messages.
5. **Pre-review checks** — CI/CD green, no merge conflicts, branch up to date with target.

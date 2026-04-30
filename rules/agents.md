# Agents

How to pick a subagent and how the implementation workflow uses them.

## Delegation and parallelism

Delegate to a subagent rather than doing specialized work inline. Pass complete context — the design, relevant file contents, and any prior review feedback — so the subagent can work independently.

Parallelise delegation when subtasks are independent. The rule of thumb:

| Work type | Default |
|-----------|---------|
| Research, exploration, reviews on different files/modules | Parallel |
| Implementation across non-overlapping files or modules | Parallel (fan-out / fan-in) |
| Implementation on overlapping files, or step B depends on step A | Sequential |

Maintain single ownership per artifact — no two subagents modifying the same file in one fan-out.

BAD (same file, two editors collide):

```
typescript-developer: add feature A to src/foo.ts
typescript-developer: add feature B to src/foo.ts
```

GOOD (independent modules, safe to run in parallel):

```
typescript-developer: implement src/foo.ts
go-developer:         implement cmd/bar.go
typescript-reviewer:  review the TS diff
go-reviewer:          review the Go diff
```

When a language-specific reviewer surfaces a CRITICAL security finding, invoke `security-reviewer` next before merging.

## Subagent registries

The roster of available subagents lives in the `available-agents` skill. Read only the registry matching your task — don't load all five eagerly:

- `~/.claude/skills/available-agents/registries/language-developers.md` — implementation in a specific programming language
- `~/.claude/skills/available-agents/registries/language-reviewers.md` — language-specific code review
- `~/.claude/skills/available-agents/registries/framework-developers.md` — React, EF Core, Doctrine, Laminas
- `~/.claude/skills/available-agents/registries/cicd-developers.md` — GitHub Actions, GitLab CI
- `~/.claude/skills/available-agents/registries/core-specialists.md` — architect, planner, code-reviewer, security-reviewer, code-simplifier, refactor-cleaner, doc-updater, mcp-builder

## Implementation workflow

0. **Research & reuse** _(mandatory before any new implementation)_ — scan the codebase for existing implementations, utilities, and patterns to reuse or adapt; read adjacent code to understand interfaces and wiring; confirm library APIs against primary vendor docs for the installed version.
1. **Plan** — invoke `planner` for anything non-trivial. Output phases, dependencies, and risks before coding.
2. **Implement** — delegate to the matching language-developer. When the work decomposes into non-overlapping files or modules, fan out to multiple developers in parallel (see **Delegation and parallelism**). Chain a framework-developer on top for framework-specific work (it assumes the base language rules). Handle cross-language orchestration or unclear scope inline.
3. **Review** — invoke `code-reviewer` immediately after implementing, plus the matching language reviewer. Address CRITICAL and HIGH findings; fix MEDIUM when possible.
4. **Commit & push** — conventional-commits format, descriptive messages.
5. **Pre-review checks** — CI/CD green, no merge conflicts, branch up to date with target.

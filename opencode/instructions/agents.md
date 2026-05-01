# Agents

How to pick a subagent and how the implementation workflow uses them.

## Available subagents

When a task needs specialized knowledge or a focused pass over the code, delegate to a subagent rather than doing the work inline. Pass complete context — the design, relevant file contents, and any prior review feedback. When a language-specific reviewer surfaces a CRITICAL security finding, invoke `security-reviewer` next before merging.

| Agent | Purpose | When to invoke |
|-------|---------|----------------|
| planner | Implementation planning | Complex features, multi-step refactoring, or new architecture that needs phases, dependencies, and risks laid out before coding. |
| architect | System design and tradeoffs | Multiple viable approaches, user is unsure, or open-ended design questions. Can run before the workflow to produce a decision document. |
| code-reviewer | Quality, security, and maintainability review | After every design and every implementation. |
| security-reviewer | Vulnerability detection | Auth, user input, DB queries, crypto, API endpoints, file I/O, or anything handling sensitive data. |
| code-simplifier | Simplify existing code | Clarifying or consolidating code without changing behavior. |
| refactor-cleaner | Dead code and duplicate removal | Unused exports or imports, duplicate logic, or leftover scaffolding. |
| performance-optimizer | Bottleneck analysis | Slow queries, N+1 patterns, algorithmic hotspots, or memory/resource leaks. |
| doc-updater | Documentation and codemaps | Public API changes, README drift, or docstring gaps. |
| mcp-builder | MCP server development | Building Model Context Protocol servers — tools, resources, prompts, transports. Cross-stack. |
| github-actions-developer | GitHub Actions workflows | Authoring or fixing workflows under `.github/workflows/`, composite actions, reusable workflows. Cross-stack. |
| gitlab-ci-developer | GitLab CI/CD pipelines | Authoring or fixing `.gitlab-ci.yml`, CI/CD components, child pipelines. Cross-stack. |
| typescript-developer | TypeScript/JavaScript implementation | Any TypeScript or JavaScript implementation task. Pair with `typescript-reviewer` afterward. |
| react-developer | React / Next.js / Remix implementation | Components, hooks, or framework-specific work. Layers on `typescript-developer`; pair with `typescript-reviewer` afterward. |
| go-developer | Go implementation | Any Go implementation task. Pair with `go-reviewer` afterward. |
| csharp-developer | C#/.NET implementation | Any C# implementation task. Pair with `csharp-reviewer` afterward. |
| efcore-developer | Entity Framework Core implementation | EF Core entities, migrations, queries. Layers on `csharp-developer`; pair with `csharp-reviewer` afterward. |
| php-developer | PHP implementation | Any PHP implementation task. Pair with `php-reviewer` afterward. |
| laminas-developer | Laminas / Mezzio implementation | Laminas MVC or Mezzio modules, middleware, forms. Layers on `php-developer`; pair with `php-reviewer` afterward. |
| doctrine-developer | Doctrine ORM implementation | Entities, DQL, repositories, migrations. Layers on `php-developer`; pair with `php-reviewer` afterward. |
| typescript-reviewer | TypeScript/JavaScript-specific review | Any TypeScript or JavaScript change. |
| go-reviewer | Go-specific review | Any Go change. |
| csharp-reviewer | C#/.NET-specific review | Any C# change. |
| php-reviewer | PHP-specific review | Any PHP change. |

## Implementation workflow

Before implementing anything new: scan the codebase for existing implementations, utilities, and patterns to reuse or adapt — read adjacent code to understand interfaces and wiring, and confirm library APIs against vendor docs for the installed version. Speculative new code on top of unread existing code is the default failure mode.

For anything non-trivial, invoke `planner` to lay out phases, dependencies, and risks before coding. Delegate implementation to the matching language-developer (chain a framework-developer on top for framework-specific work — it assumes the base language rules); handle cross-language orchestration or unclear scope inline. Immediately after implementing, invoke `code-reviewer` plus the matching language reviewer; address CRITICAL and HIGH findings, fix MEDIUM when reasonable. Commit and push in conventional-commits format with descriptive messages, then verify CI/CD green and the branch is up to date before requesting review.

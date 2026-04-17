# Agents

How to pick a subagent and how the implementation workflow uses them.

## Available subagents

When a task needs specialized knowledge or a focused pass over the code, delegate to a subagent rather than doing the work inline. Pass complete context — the design, relevant file contents, and any prior review feedback — so the subagent can work independently. When a language-specific reviewer surfaces a CRITICAL security finding, invoke `security-reviewer` next for a focused vulnerability pass before merging.

| Agent | Purpose | When to invoke |
|-------|---------|----------------|
| planner | Implementation planning | Complex features, multi-step refactoring, or new architecture that needs phases, dependencies, and risks laid out before coding. |
| architect | System design and tradeoffs | Multiple viable approaches, user is unsure, or open-ended design questions. Can run before the workflow to produce a decision document. |
| code-reviewer | Quality, security, and maintainability review | After every design and every implementation. |
| security-reviewer | Vulnerability detection | Auth, user input, DB queries, crypto, API endpoints, file I/O, or anything handling sensitive data. |
| code-simplifier | Simplify existing code | Clarifying or consolidating code without changing behavior. |
| refactor-cleaner | Dead code and duplicate removal | Unused exports or imports, duplicate logic, or leftover scaffolding. |
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
| python-developer | Python implementation | Any Python implementation task — Django, Flask, FastAPI, plain. Pair with `python-reviewer` afterward. |
| java-developer | Java implementation | Any Java implementation task. Pair with `java-reviewer` afterward. |
| cpp-developer | C++ implementation | Any C++ implementation task. Pair with `cpp-reviewer` afterward. |
| rust-developer | Rust implementation | Any Rust implementation task. Pair with `rust-reviewer` afterward. |
| typescript-reviewer | TypeScript/JavaScript-specific review | Any TypeScript or JavaScript change. |
| go-reviewer | Go-specific review | Any Go change. |
| csharp-reviewer | C#/.NET-specific review | Any C# change. |
| php-reviewer | PHP-specific review | Any PHP change. |
| python-reviewer | Python-specific review | Any Python change. |
| java-reviewer | Java-specific review | Any Java change. |
| cpp-reviewer | C++-specific review | Any C++ change. |
| rust-reviewer | Rust-specific review | Any Rust change. |

## Implementation workflow

The Feature Implementation Workflow describes the development pipeline: research, planning, code review, and committing to git.

0. **Research & Reuse** _(mandatory before any new implementation)_
   - **Scan the codebase first:** Search for existing implementations, utilities, and patterns that can be reused or adapted before writing anything new.
   - **Read related files:** Understand how adjacent code is structured, what interfaces exist, and how dependencies are wired.
   - **Library docs:** Use primary vendor docs to confirm API behavior, package usage, and version-specific details before implementing.
   - Prefer adopting or adapting a proven existing approach over writing net-new code.

1. **Plan First**
   - Use **planner** agent to create implementation plan
   - Generate planning docs before coding: PRD, architecture, system_design, tech_doc, task_list
   - Identify dependencies and risks
   - Break down into phases

2. **Implement**
   - For language-specific work, delegate to the matching developer agent. Each one knows its language's idioms, tooling, and anti-patterns, and will run the project's type checker / linter / tests before reporting done.
   - Available developer agents:

   | Agent | Use for |
   |-------|---------|
   | **cpp-developer** | C++ (.cpp / .hpp / .cc / .h) |
   | **csharp-developer** | C# / .NET (.cs) |
   | **go-developer** | Go (.go) |
   | **java-developer** | Java (.java) |
   | **php-developer** | PHP (.php) — Laravel, Symfony, vanilla |
   | **python-developer** | Python (.py) — Django, Flask, FastAPI, plain |
   | **rust-developer** | Rust (.rs) |
   | **typescript-developer** | TypeScript / JavaScript (.ts / .tsx / .js / .jsx) — React, Next.js, Node |

   - For framework-specific work, chain the framework agent on top of the matching language agent. Framework agents assume the base language-developer's rules already apply; they add framework-specific idioms and anti-patterns.

   | Agent | Use for | Base agent |
   |-------|---------|------------|
   | **react-developer** | React / Next.js / Remix components, hooks, routing | typescript-developer |
   | **efcore-developer** | Entity Framework Core models, migrations, queries | csharp-developer |
   | **laminas-developer** | Laminas MVC / Mezzio modules, middleware, forms | php-developer |
   | **doctrine-developer** | Doctrine ORM entities, DQL, migrations | php-developer |

   Cross-stack specialists (no base language pairing):

   | Agent | Use for |
   |-------|---------|
   | **mcp-builder** | Model Context Protocol servers, tools, resources, prompts |
   | **github-actions-developer** | `.github/workflows/` workflows, composite actions, reusable workflows |
   | **gitlab-ci-developer** | `.gitlab-ci.yml` pipelines, includes, CI/CD components, child pipelines |

   - For cross-language orchestration, design, or unclear scope, handle inline rather than delegating.

3. **Code Review**
   - Use **code-reviewer** agent immediately after writing code
   - Pair with the matching language reviewer (e.g. `typescript-reviewer` after `typescript-developer`)
   - Address CRITICAL and HIGH issues
   - Fix MEDIUM issues when possible

4. **Commit & Push**
   - Detailed commit messages
   - Follow conventional commits format

5. **Pre-Review Checks**
   - Verify all automated checks (CI/CD) are passing
   - Resolve any merge conflicts
   - Ensure branch is up to date with target branch
   - Only request review after these checks pass

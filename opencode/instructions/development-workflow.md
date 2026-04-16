# Development Workflow

The Feature Implementation Workflow describes the development pipeline: research, planning, code review, and committing to git.

## Feature Implementation Workflow

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
   | **csharp-developer** | C# / .NET (.cs) |
   | **go-developer** | Go (.go) |
   | **php-developer** | PHP (.php) — Laravel, Symfony, vanilla |
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

---
name: available-agents
description: Subagent registry index. Read the matching registry file under registries/ when you need to find the right subagent to delegate to. Use when picking a subagent for language implementation, language review, framework work, CI/CD pipelines, or specialist tasks (planning, architecture, security, simplification, dead-code cleanup, doc updates, MCP, performance).
---

# available-agents

When you need to delegate work to a subagent, read the registry file matching the work category. Each registry is a markdown table of agents in that category with one-line role and "when to invoke" notes.

## Registries

- `registries/language-developers.md` — implementation in a specific programming language
- `registries/language-reviewers.md` — language-specific code review
- `registries/framework-developers.md` — framework-specific implementation (React, EF Core, Doctrine, Laminas)
- `registries/cicd-developers.md` — CI/CD pipeline authoring (GitHub Actions, GitLab CI)
- `registries/core-specialists.md` — language-agnostic specialists (architecture, planning, generic review, security, simplification, dead-code cleanup, doc updates, MCP server dev, performance)

Read only the registry matching your task. Don't load all five eagerly.

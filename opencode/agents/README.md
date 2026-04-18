# Agents

### Orchestration and planning

| Agent | What it does |
|-------|--------------|
| `lead` | The primary orchestrator. Runs the end-to-end workflow, deciding when to hand off to specialists. |
| `planner` | Breaks complex work into phases with dependencies and risks. Writes plans, not code. |
| `architect` | Compares design alternatives, identifies trade-offs. Used when multiple approaches are viable. |

### Review

| Agent | What it does |
|-------|--------------|
| `code-reviewer` | Quality, maintainability, and security review across any language. |
| `security-reviewer` | OWASP Top 10 and common vulnerability detection. Blocks progress on CRITICAL / HIGH findings. |
| `typescript-reviewer`, `go-reviewer`, `csharp-reviewer`, `php-reviewer` | Language-specific review after the matching developer writes code. |

### Language developers

| Agent | Stack |
|-------|-------|
| `typescript-developer` | TypeScript / JavaScript |
| `go-developer` | Go |
| `csharp-developer` | C# / .NET |
| `php-developer` | PHP |

### Framework developers

| Agent | Framework | Base |
|-------|-----------|------|
| `react-developer` | React / Next.js / Remix | `typescript-developer` |
| `efcore-developer` | Entity Framework Core | `csharp-developer` |
| `doctrine-developer` | Doctrine ORM | `php-developer` |
| `laminas-developer` | Laminas / Mezzio | `php-developer` |

### Cross-stack specialists

| Agent | When it helps |
|-------|---------------|
| `mcp-builder` | Building [Model Context Protocol](https://modelcontextprotocol.io/) servers. |
| `github-actions-developer` | Authoring or fixing GitHub Actions workflows. |
| `gitlab-ci-developer` | GitLab CI/CD pipelines, components, child pipelines. |
| `performance-optimizer` | Slow queries, N+1 patterns, algorithmic hotspots. |

### Maintenance

| Agent | What it does |
|-------|--------------|
| `code-simplifier` | Clarifies or consolidates code without changing behavior. |
| `refactor-cleaner` | Finds and removes dead code, unused imports, duplicated logic. |
| `doc-updater` | Updates documentation and docstrings after code changes. |

# Agents

An **agent** is a specialized AI assistant with its own role, tone, and boundaries. Instead of one generalist AI doing everything, OpenCode can hand off to a focused agent — a planner for laying out steps, a reviewer for catching issues, a language specialist for idiomatic code.

Each agent file here (one markdown file per agent) defines:

- What the agent is good at
- What tools/permissions it has
- The system prompt that shapes its behavior

When you ask for something, OpenCode either handles it in the main conversation or delegates to the right agent based on the task. You can also invoke one explicitly by mentioning it (e.g. `@code-reviewer`).

## When you'll notice agents working

- You say *"plan this out"* or run `/plan` → the **planner** drafts a phased implementation plan.
- You run `/review` or `/code-review` → the **code-reviewer** works through your changes and surfaces findings by severity.
- You touch auth, user input, or secrets → the **security-reviewer** should get invoked (and is, automatically, when the `/security-review` command runs).
- You write Go, TypeScript, C#, or PHP → the matching language developer takes over for the implementation, and the matching reviewer checks afterward.
- You hit something architectural and ambiguous → the **architect** sketches trade-offs before code gets written.

## The roster

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

Write idiomatic code in their target language. Pair each with its reviewer.

| Agent | Stack |
|-------|-------|
| `typescript-developer` | TypeScript / JavaScript |
| `go-developer` | Go |
| `csharp-developer` | C# / .NET |
| `php-developer` | PHP |

### Framework developers

Layer on top of a language developer — they inherit the base language rules and add framework-specific conventions.

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

## Shared rules every agent follows

See [`AGENTS.md`](../AGENTS.md) in this folder. It's inserted into every agent's prompt and covers:

- General tone (direct, pragmatic, no fluff)
- Security basics (validate input, parameterize queries, no secrets in code)
- Accuracy rules (verify references, state uncertainty explicitly)
- Coding style (KISS, DRY, YAGNI, naming conventions)
- Code review standards (severity levels, approval criteria)
- Testing expectations (coverage, TDD, naming)

## For config authors

Each agent is a markdown file with YAML frontmatter. The filename (minus `.md`) becomes the agent's ID.

### Frontmatter schema

Only these keys are recognized by OpenCode. Unknown keys are silently ignored. Authoritative docs: <https://opencode.ai/docs/agents/>.

| Key | Required | Notes |
|-----|----------|-------|
| `description` | yes | How the router picks this agent. Name the role and top capabilities; end with "Use when …". |
| `mode` | no | `primary` / `subagent` / `all` (default `all`). |
| `model` | no | Override default LLM for this agent. |
| `temperature` | no | 0.0–1.0. |
| `top_p` | no | Alternative randomness control. |
| `steps` | no | Max agentic iterations. |
| `prompt` | no | Path to a custom system prompt file. |
| `permission` | no | Per-agent override of `edit` / `bash` / `webfetch` / `task` permissions (each `allow` / `ask` / `deny`). |
| `color`, `disable`, `hidden` | no | UI / toggles. |

### Adding a new agent

1. Create `<name>.md` with frontmatter and a system prompt body. Match an existing file in the same category as a starting point.
2. Write a strong `description` — the router uses it to decide when to fire this agent.
3. Add a row to the appropriate roster table above.
4. Update the **Available subagents** table in `AGENTS.md` with the agent's purpose.
5. If it's a reviewer, also update the `# Code Review` section of `AGENTS.md`.

OpenCode auto-discovers the new file on next session start — no registry to touch, no restart beyond opening a fresh session.

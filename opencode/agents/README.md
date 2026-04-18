# Agents

Markdown files that define specialized subagents OpenCode can delegate to. Each file has YAML frontmatter (config) and a markdown body (system prompt).

## How OpenCode loads them

1. On session start, OpenCode scans `opencode/agents/*.md`.
2. The filename stem becomes the agent ID (e.g. `code-reviewer.md` → `code-reviewer`).
3. The frontmatter configures mode, model, temperature, permissions, etc.
4. The markdown body becomes the agent's system prompt.

## Frontmatter schema

Only the keys below are recognised. Unknown keys are silently ignored — they signal drift (usually stale Claude Code keys). Authoritative source: <https://opencode.ai/docs/agents/>.

| Key | Required | Notes |
|-----|----------|-------|
| `description` | yes | Trigger phrase used for agent discovery. |
| `mode` | no | `primary` / `subagent` / `all` (default `all`). |
| `model` | no | Override default LLM for this agent. |
| `temperature` | no | 0.0–1.0. |
| `top_p` | no | Alternative randomness control. |
| `steps` | no | Max agentic iterations. |
| `prompt` | no | Path to custom system prompt file. |
| `permission` | no | Nested map with `edit` / `bash` / `webfetch` / `task` keys set to `allow` / `ask` / `deny`. Overrides the global block in `opencode.jsonc`. |
| `color` | no | Hex (`"#8AF793"`) or theme colour name. |
| `disable` | no | `true` to disable without deleting. |
| `hidden` | no | `true` to hide from `@` autocomplete. |

**Claude Code-only keys to strip when porting:** `tools:` (deprecated in OpenCode — translate to a `permission` block), `agent:` / `context:` / `allowed-tools:` (CC skill keys with no OC equivalent), `disable-model-invocation:` (CC-only).

## Cross-agent instructions

Shared rules every agent inherits live in `opencode/AGENTS.md` (general, security, accuracy, coding style, code review, testing, patterns). The **Available subagents** table at the bottom of AGENTS.md is the authoritative index of when to invoke each agent, with the implementation workflow that ties them together.

The inventory below is a mechanical listing of files in this directory for navigation. For *when to pick* each agent, consult AGENTS.md.

## Inventory

### Orchestration and planning

- `lead.md` — primary orchestrator that sequences other agents through the implementation workflow.
- `planner.md` — decomposes complex work into phased plans with dependencies and risks.
- `architect.md` — system design and tradeoff analysis for ambiguous problems.

### Review

- `code-reviewer.md` — general-purpose quality, security, and maintainability review.
- `security-reviewer.md` — OWASP Top 10 and vulnerability detection for security-sensitive changes.
- `csharp-reviewer.md`, `go-reviewer.md`, `php-reviewer.md`, `typescript-reviewer.md` — language-specific reviewers.

### Cross-stack developers

- `mcp-builder.md` — Model Context Protocol server authoring.
- `github-actions-developer.md` — GitHub Actions workflows, composite actions, reusable workflows.
- `gitlab-ci-developer.md` — GitLab CI/CD pipelines, components, child pipelines.
- `performance-optimizer.md` — bottleneck analysis across queries, algorithms, memory.

### Language developers

- `csharp-developer.md`, `go-developer.md`, `php-developer.md`, `typescript-developer.md` — base language implementers. Pair with the matching reviewer afterward.

### Framework developers

Layer on top of a language-developer; inherit its base rules.

- `react-developer.md` — React / Next.js / Remix (on top of `typescript-developer`).
- `efcore-developer.md` — Entity Framework Core (on top of `csharp-developer`).
- `doctrine-developer.md` — Doctrine ORM (on top of `php-developer`).
- `laminas-developer.md` — Laminas / Mezzio (on top of `php-developer`).

### Maintenance

- `code-simplifier.md` — clarify or consolidate without changing behavior.
- `refactor-cleaner.md` — remove dead code and duplicates.
- `doc-updater.md` — documentation drift, codemaps, docstring gaps.

## Adding a new agent

1. Create `<name>.md` with frontmatter and system prompt. Match the style of an existing file in the same category.
2. Confirm `description` is a trigger phrase the router can match on — role + top 2-3 capabilities + "Use when …".
3. Add the file path to `opencode/.opencode/sync-configs-manifest.md` under `## Agents`.
4. Update the **Available subagents** table in `opencode/AGENTS.md` with the agent's purpose and when-to-invoke phrasing.
5. Add a bullet to the inventory above.
6. If the new agent is a reviewer, also update the `# Code Review` section of `AGENTS.md`.

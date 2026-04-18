# Commands

Slash commands the user invokes from the TUI (e.g. `/plan`, `/commit`, `/handoff`). Each command is a markdown file with YAML frontmatter that either delegates to an agent or contains the full instruction body inline.

## How OpenCode loads them

1. On session start, OpenCode scans `opencode/commands/*.md` and `opencode/.opencode/commands/*.md`.
2. The filename stem becomes the command name (e.g. `plan.md` → `/plan`).
3. The frontmatter's `description` shows in the TUI.
4. If `agent:` is set, invoking the command delegates to that agent (optionally forced as a subagent via `subtask: true`).
5. If no `agent:` is set, the body is treated as the command prompt itself.

## Frontmatter schema

| Key | Required | Notes |
|-----|----------|-------|
| `description` | yes | Shown in TUI. Keep it concise and action-oriented. |
| `agent` | no | Name of the delegating agent (must match a file in `agents/`). |
| `subtask` | no | `true` forces subagent invocation even when `agent` is `mode: primary`. |
| `model` | no | Override default LLM for this command. |

OpenCode docs: <https://opencode.ai/docs/commands/>.

Some commands have no frontmatter at all (e.g. `.opencode/commands/sync-configs.md`) — those are pure procedural documents OpenCode reads as-is.

## Inventory

### Workflow

- `/plan` — detailed phased implementation plan with file paths, risks, dependencies. No code. Delegates to `planner`.
- `/design` — architectural design for a complex problem. Components, data flow, trade-offs, alternatives. No code, no persistence. Delegates to `architect`.
- `/orchestrate` — sequence multiple agents for complex tasks. Delegates to `planner`.
- `/verify` — run verification loop to validate implementation. Delegates to `lead`.

### Review

- `/review` — general code review with findings. Delegates to `code-reviewer`.
- `/code-review` — comprehensive review of staged + unstaged changes with severity-graded findings (CRITICAL / HIGH / MEDIUM / LOW) and a verdict. Delegates to `code-reviewer`.
- `/security-review` — OWASP Top 10 + common vulnerability patterns; CRITICAL / HIGH findings block progress. Delegates to `security-reviewer`.
- `/go-review` — Go idiomatic patterns and best practices. Delegates to `go-reviewer`.

### Refactor

- `/refactor-clean` — find and safely remove unused code, dead dependencies, and duplicated logic. Categorises by risk (SAFE / CAREFUL / RISKY); removes only SAFE items and verifies between batches. Delegates to `refactor-cleaner`.
- `/update-docs` — update documentation to reflect code changes. Delegates to `doc-updater`.

### Git

- `/commit` — stage and commit changes.
- `/commit-push` — stage, commit, and push.
- `/push` — push the current branch to remote.
- `/summarize-branch` — summarize all changes on the current branch.

### Session

- `/handoff` — save a structured session summary to `~/.opencode-artifacts/<project>/handoff.md`. Overwrites on each run.
- `/catchup` — read the handoff artifact and orient a new session.
- `/cleanup-artifacts` — delete artifacts under `~/.opencode-artifacts/`. Accepts zero, one, or two positional args to scope by project, by command, or both.

### Distribution

- `/sync-configs` (`.opencode/commands/sync-configs.md`) — fetches this repo's OpenCode configs from `raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/` and syncs them into the user's local install. See `.opencode/sync-configs-manifest.md` for the list of files shipped.

## OpenCode-exclusive commands

Some commands have no Claude Code equivalent because they depend on OpenCode-only patterns (like `~/.opencode-artifacts/`). These live only in `opencode/commands/` or `opencode/.opencode/commands/` and should never gain a mirrored Claude Code skill.

Currently: `/handoff`, `/catchup`, `/cleanup-artifacts`, `/sync-configs`.

## Adding a new command

1. Create `<name>.md` with frontmatter (if the command delegates or is CLI-invoked) or a pure doc-style body.
2. Add the file path to `opencode/.opencode/sync-configs-manifest.md` under `## Commands`.
3. Add a bullet to the inventory above.
4. If it's OpenCode-exclusive (relies on `~/.opencode-artifacts/` or similar), document it in the "OpenCode-exclusive commands" section of `opencode/.claude/CLAUDE.md` too.

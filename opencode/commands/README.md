# Slash commands

Commands you type into OpenCode with a `/` prefix to trigger a specific workflow. Most delegate to an agent behind the scenes — you don't have to remember who does what.

Type `/` in the TUI to see the list inline, or refer to the catalogue below.

## Day-to-day workflow

| Command | What it does |
|---------|--------------|
| `/plan` | Draft a phased implementation plan for the current task — file paths, risks, dependencies. No code is written; it waits for your approval before executing. |
| `/design` | Produce an architectural design: components, data flow, trade-offs, alternatives. Used when the "how" isn't settled. |
| `/orchestrate` | Sequence multiple agents when a task spans several specialties. |
| `/verify` | Run the verification loop (tests, linters, typecheck) and report. |

## Reviewing code

| Command | What it does |
|---------|--------------|
| `/review` | Lightweight review of recent changes with findings. |
| `/code-review` | Comprehensive review of staged + unstaged changes. Returns severity-graded findings (CRITICAL / HIGH / MEDIUM / LOW) and an approval verdict. |
| `/security-review` | OWASP Top 10 + common vulnerabilities. CRITICAL / HIGH findings block progress until resolved. |
| `/go-review` | Go-specific idiomatic review. |

## Refactoring and cleanup

| Command | What it does |
|---------|--------------|
| `/refactor-clean` | Find unused code, dead dependencies, duplicated logic. Categorizes findings by risk (SAFE / CAREFUL / RISKY), removes only the SAFE ones, and verifies with tests between batches. |
| `/update-docs` | Update documentation to reflect the code changes in the current session. |

## Git

| Command | What it does |
|---------|--------------|
| `/commit` | Stage and commit changes with a conventional-commits message. |
| `/commit-push` | Same as `/commit` but pushes afterward. |
| `/push` | Push the current branch to the remote. |
| `/summarize-branch` | Summarize every commit on the current branch — useful before opening a PR. |

## Session continuity

These are where OpenCode earns its keep across multi-day work.

| Command | What it does |
|---------|--------------|
| `/handoff` | Save a structured summary of where you are to `~/.opencode-artifacts/<project>/handoff.md`. Overwrites on each run. Use when you need to step away mid-task. |
| `/catchup` | Read that handoff and orient the AI to resume. First thing to run when you come back. |
| `/cleanup-artifacts` | Delete artifacts under `~/.opencode-artifacts/`. Accepts zero, one, or two positional args to scope by project, by command, or both. Always asks before deleting. |

## Distribution

| Command | What it does |
|---------|--------------|
| `/sync-configs` | Fetch the latest OpenCode configs from this repo and merge them into your local install. Asks before overwriting anything it's unsure about. |

## OpenCode-only commands

`/handoff`, `/catchup`, `/cleanup-artifacts`, and `/sync-configs` exist only for OpenCode — they rely on OC-specific conventions (`~/.opencode-artifacts/`, the plugin SDK) that don't have Claude Code equivalents.

## For config authors

Each command is a markdown file with YAML frontmatter. The filename (minus `.md`) becomes the slash name.

### Frontmatter schema

Authoritative docs: <https://opencode.ai/docs/commands/>.

| Key | Required | Notes |
|-----|----------|-------|
| `description` | yes | Shown in the TUI command list. Keep it concise and action-oriented. |
| `agent` | no | Delegates to the named agent (must match a file in `agents/`). |
| `subtask` | no | `true` forces the agent to run as a subagent even if its mode is `primary`. |
| `model` | no | Override the default LLM for this command. |

Pure documentation commands (like `.opencode/commands/sync-configs.md`) have no frontmatter — OpenCode reads the body as-is.

### Adding a new command

1. Create `<name>.md` with frontmatter and, if delegating, set `agent:`.
2. Add the file to `opencode/.opencode/sync-configs-manifest.md` under `## Commands`.
3. Add a row to the appropriate table above.
4. If it relies on OpenCode-exclusive patterns (like `~/.opencode-artifacts/`), document it in the "OpenCode-exclusive commands" section of `opencode/.claude/CLAUDE.md`.

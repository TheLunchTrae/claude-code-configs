# OpenCode configs — agent notes

# Work environment notes

These notes apply to the OpenCode installation used at work. They do not affect Claude Code.

## Available tools

**Playwright** — Playwright is installed and available in this environment. The `e2e-runner`
agent and any E2E testing workflows can use `npx playwright test` and related commands directly.

**GitLab MCP server** — A GitLab MCP server is configured for the internal GitLab instance at
work. This provides MCP tools for reading issues, MRs, pipelines, and repository data. It does
not need to be declared in `opencode.jsonc` — it is available through the MCP server
configuration. When working with GitLab-hosted repos, agents can use these tools for context.
Do not hardcode GitLab URLs or tokens in any config file.

# opencode.jsonc — permission notes

The `permission.bash` block is matched top-down with last-matching-pattern semantics, so denies must sit at the bottom to take precedence over broader allows or asks. The canonical order is **`allow` rules → `ask` rules → `deny` rules**, and each group is sorted alphabetically. Keep rules grouped and alphabetised on every edit.

The `permission.edit` is set to `"ask"` globally.

This directory contains OpenCode-specific configuration. It is not a Claude Code config directory — OpenCode reads `AGENTS.md`, `opencode.jsonc`, and files under `agents/`, `commands/`, and `skills/`. This `.claude/CLAUDE.md` file is read only by Claude Code agents working in this repository, not by OpenCode itself.

# Hooks are out of scope

Hooks are intentionally not versioned in this repo on either the Claude Code side or the OpenCode side. The opencode-sync mapping reflects that — no hook entries exist. Do not add any.

# OpenCode-exclusive commands

Some commands in `opencode/commands/` have no Claude Code equivalent and should never be given one. They exist only in OpenCode because they rely on patterns or conventions (like `~/.opencode-artifacts/`) that belong to OpenCode sessions.

Do not create a matching `skills/<name>/SKILL.md` for any command listed here. Do not add them to the opencode-sync mapping.

**If you add, rename, or remove an OpenCode-exclusive command, update this file in the same commit.**

## Registry

### /handoff — `opencode/commands/handoff.md`

Saves a structured session summary to `~/.opencode-artifacts/<project>/handoff.md`. Overwrites on each run. Used to preserve context across sessions manually.

OpenCode-exclusive because: writes to `~/.opencode-artifacts/`, a convention that only exists for OpenCode sessions.

### /catchup — `opencode/commands/catchup.md`

Reads `~/.opencode-artifacts/<project>/handoff.md` and orients the agent at the start of a new session.

OpenCode-exclusive because: reads from `~/.opencode-artifacts/`, paired with `/handoff`.

### /cleanup-artifacts — `opencode/commands/cleanup-artifacts.md`

Deletes artifacts under `~/.opencode-artifacts/`. Accepts zero, one, or two positional arguments: a project name removes all artifacts for that project, a command name removes that command's file from every project, both together (`<project> <command>`) deletes a single file, and no arguments deletes everything. Always lists files and asks for confirmation before deleting.

OpenCode-exclusive because: operates on `~/.opencode-artifacts/`, a convention that only exists for OpenCode sessions.

### /sync-configs — `opencode/.opencode/commands/sync-configs.md`

Fetches each file in a manifest from `raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/`, compares to the local copy under `~/.claude/`, and merges changes (prefer remote, preserve clear local-only customizations, ask user when intent is ambiguous or diffs are large). Reports updated, unchanged, and failed files.

OpenCode-exclusive because: it writes directly to `~/.claude/` config files and is designed for syncing the global OpenCode config setup, not for use within individual projects.

# Artifact storage convention

OpenCode commands that write persistent artifacts use:

```
~/.opencode-artifacts/<project>/<command>.md
```

- `<project>` is the git remote repo name, local repo directory name, or working directory name (in that priority order)
- `<command>` matches the command directory name under `opencode/commands/`
- Single file per command per project, overwritten on each run (no append/history)

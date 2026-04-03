# OpenCode configs — agent notes

This directory contains OpenCode-specific configuration. It is not a Claude Code config directory — OpenCode reads `AGENTS.md`, `opencode.jsonc`, and files under `agents/`, `commands/`, and `skills/`. This `.claude/CLAUDE.md` file is read only by Claude Code agents working in this repository, not by OpenCode itself.

# OpenCode-exclusive commands

Some commands in `opencode/commands/` have no Claude Code equivalent and should never be given one. They exist only in OpenCode because they rely on patterns or conventions (like `~/.opencode-artifacts/`) that belong to OpenCode sessions.

Do not create a matching `skills/<name>/SKILL.md` for any command listed here. Do not add them to the opencode-sync mapping.

**If you add, rename, or remove an OpenCode-exclusive command, update this file in the same commit.**

## Registry

### /handoff — `opencode/commands/handoff/COMMAND.md`

Saves a structured session summary to `~/.opencode-artifacts/handoff/<project>.md`. Overwrites on each run. Used to preserve context across sessions manually.

OpenCode-exclusive because: writes to `~/.opencode-artifacts/`, a convention that only exists for OpenCode sessions.

### /catchup — `opencode/commands/catchup/COMMAND.md`

Reads `~/.opencode-artifacts/handoff/<project>.md` and orients the agent at the start of a new session.

OpenCode-exclusive because: reads from `~/.opencode-artifacts/`, paired with `/handoff`.

### /cleanup-artifacts — `opencode/commands/cleanup-artifacts/COMMAND.md`

Deletes artifacts under `~/.opencode-artifacts/`. Accepts zero, one, or two positional arguments: a command name targets that command's directory, a project name removes that project's file across all commands, both together deletes a single file, and no arguments deletes everything.

OpenCode-exclusive because: operates on `~/.opencode-artifacts/`, a convention that only exists for OpenCode sessions.

# Artifact storage convention

OpenCode commands that write persistent artifacts use:

```
~/.opencode-artifacts/<command-name>/<project>.md
```

- `<command-name>` matches the command directory name under `opencode/commands/`
- `<project>` is the git remote repo name, local repo directory name, or working directory name (in that priority order)
- Single file per project, overwritten on each run (no append/history)

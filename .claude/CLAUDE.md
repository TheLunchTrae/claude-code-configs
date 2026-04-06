This repository is a versioned backup of a `~/.claude` directory for Claude Code.
It is a config repo, not a software project — there is no application to build or run.

Files here are Claude Code configuration: `CLAUDE.md` (minimal pointer), `rules/` (user-level
rules split by topic), `settings.json` (permissions and plugins), `agents/` (subagent definitions),
and `skills/` (user-invocable slash commands).

Do not treat the absence of source code as a problem to fix.

# Symlinking into .claude/

Every file added to `agents/`, `rules/`, or `skills/` in this repo must have a corresponding relative symlink created inside `.claude/` in the same operation — unless explicitly told not to. Symlinking individual files (not directories) means individual files can be excluded if needed.

```
ln -sf ../../<dir>/<file> .claude/<dir>/<file>        # agents/ and rules/
ln -sf ../../../skills/<name>/<file> .claude/skills/<name>/<file>  # skills/
```

Create the target directory first with `mkdir -p` if it doesn't exist. When removing a file from the repo, remove its symlink from `.claude/` in the same operation.

# Config changes: Claude Code first, then OpenCode

By default, all config changes target the **Claude Code** configs (`rules/`, `agents/`, `skills/`, `settings.json`). After making changes to the Claude Code configs, sync them to the corresponding OpenCode equivalents in `opencode/` in the same commit (see `/opencode-sync` for the mapping).

Only skip the Claude Code side and work directly in `opencode/` if explicitly told that changes are OpenCode-only.

The `opencode/` directory has its own `opencode/.claude/CLAUDE.md` documenting OpenCode-exclusive commands and conventions (including the `~/.opencode-artifacts/` storage pattern). Check it before modifying anything in `opencode/`.

# Agent I/O design principle

Agents may define structured output formats — this is encouraged because it makes interactions predictable. No agent should ever expect or assume specific structured input. Every agent must handle whatever context it receives and adapt accordingly. When editing agent files, enforce this: remove any language that gates behavior on expected input shapes, section names, or artifacts from other agents.

Subagents must not reference other agents by name. A subagent's behavior must be fully self-contained — it should not assume which orchestrator invoked it, which agents may follow, or what role other agents play. Use role descriptions ("the implementer", "whoever follows up") rather than agent names. This keeps subagents composable and independent. Primary/orchestrating agents may reference specific subagents by name when directing work.

# File placement

The root `CLAUDE.md` is the **global user prompt** — it travels with the user across all projects. Keep it general-purpose.

This `.claude/` directory is for **repo-specific Claude functionality**: skills, hooks, or instructions that apply only when working inside this repository. When adding or modifying Claude features that are specific to managing this repo (e.g. the OpenCode sync skill), place them here in `.claude/`, not in the root `skills/` or `agents/` directories.

This repository is a versioned backup of a `~/.claude` directory for Claude Code.
It is a config repo, not a software project — there is no application to build or run.

Files here are Claude Code configuration: `CLAUDE.md` (minimal pointer), `rules/` (user-level
rules split by topic), `settings.json` (permissions and plugins), `agents/` (subagent definitions),
and `skills/` (user-invocable slash commands).

Do not treat the absence of source code as a problem to fix.

# Reference: everything-claude-code (ECC)

These configs are based on [everything-claude-code](https://github.com/affaan-m/everything-claude-code) by affaan-m. When working in this repo and needing to reference ECC, clone it locally:

```sh
git clone https://github.com/affaan-m/everything-claude-code.git /tmp/ecc
```

Key ECC paths to reference:
- `/tmp/ecc/rules/common/` — common rules across languages
- `/tmp/ecc/.opencode/` — ECC's OpenCode configuration (uses `instructions` array + `instructions/` folder)

# Symlinking into .claude/

Every file added to `agents/`, `rules/`, or `skills/` in this repo must have a corresponding relative symlink created inside `.claude/` in the same operation — unless explicitly told not to. Symlinking individual files (not directories) means individual files can be excluded if needed.

```
ln -sf ../../<dir>/<file> .claude/<dir>/<file>        # agents/ and rules/
ln -sf ../../../skills/<name>/<file> .claude/skills/<name>/<file>  # skills/
```

Create the target directory first with `mkdir -p` if it doesn't exist. When removing a file from the repo, remove its symlink from `.claude/` in the same operation.

**Not all agents are symlinked here.** This is a config-only repo with no source code, so language-specific code reviewers (`code-reviewer`, `cpp-reviewer`, `csharp-reviewer`, `go-reviewer`, `java-reviewer`, `php-reviewer`, `python-reviewer`, `rust-reviewer`, `typescript-reviewer`) are intentionally excluded from `.claude/agents/`. Only the 5 config-management agents are symlinked: `architect`, `developer`, `planner`, `reviewer`, `security-reviewer`. When adding new agents to the repo, follow the same standard — only symlink agents that are relevant to working in a config repo. Do not symlink language-specific or code-review agents.

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

This repository is a versioned backup of a `~/.claude` directory for Claude Code.
It is a config repo, not a software project — there is no application to build or run.

Files here are Claude Code configuration: `rules/` (user-level rules split by topic),
`settings.json` (permissions, plugins, statusline, hooks), `agents/` (subagent definitions),
`skills/` (user-invocable slash commands), `hooks/` (lifecycle scripts referenced from
`settings.json`), and `statusline.sh` (the script `settings.json.statusLine` calls).
There is no root `CLAUDE.md` — Claude Code loads `rules/*.md` directly from `~/.claude/rules/`.

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

Items under `agents/`, `rules/`, and `skills/` are symlinked into `.claude/` **only when they are useful for working inside this repo.** This is a config-only repo with no source code, so anything focused on writing, reviewing, or testing application code is intentionally excluded.

```
ln -sf ../../<dir>/<file> .claude/<dir>/<file>        # agents/ and rules/
ln -sf ../../../skills/<name>/<file> .claude/skills/<name>/<file>  # skills/
```

Create the target directory first with `mkdir -p` if it doesn't exist. When removing a file from the repo, remove its symlink from `.claude/` in the same operation.

**What is intentionally NOT symlinked** (present in the repo for distribution, excluded from the active `.claude/` surface):

- **Agents** — all language reviewers (`python-reviewer`, `typescript-reviewer`, etc.), `code-simplifier`, `refactor-cleaner`, `doc-updater`. Only `architect`, `code-reviewer`, `planner`, and `security-reviewer` are symlinked.
- **Rules** — `agents`, `coding-style`, `patterns`, `performance`, `testing`. Only `accuracy`, `code-review`, `general`, and `security` are symlinked (plus the real `config-sync.md` that lives directly in `.claude/rules/`).

When adding something new, decide whether it is useful when working inside this repo and follow the same pattern.

# Config changes: Claude Code first, then OpenCode

By default, all config changes target the **Claude Code** configs (`rules/`, `agents/`, `skills/`, `settings.json`). After making changes to the Claude Code configs, mirror them to the corresponding OpenCode equivalents in `opencode/` in the same commit (see `/opencode-mirror` for the mapping, including categories that are intentionally not mirrored).

Only skip the Claude Code side and work directly in `opencode/` if explicitly told that changes are OpenCode-only.

The `opencode/` directory has its own `opencode/.claude/CLAUDE.md` documenting OpenCode-exclusive commands and conventions (including the `~/.opencode-data/` storage pattern). Check it before modifying anything in `opencode/`.

# Project-conventions file: CLAUDE.md vs AGENTS.md

When a prompt on either side tells an agent to "check project-specific conventions", use the filename that matches the tool reading it. Claude Code reads `CLAUDE.md`; OpenCode reads `AGENTS.md`. Keep the Claude Code-side copies (`rules/`, `agents/`, `skills/`) pointing at `CLAUDE.md` and the OpenCode-side copies (`opencode/`) pointing at `AGENTS.md`. Do not blanket-mirror this token when syncing changes between the two sides.

# Agent I/O design principle

Agents may define structured output formats — this is encouraged because it makes interactions predictable. No agent should ever expect or assume specific structured input. Every agent must handle whatever context it receives and adapt accordingly. When editing agent files, enforce this: remove any language that gates behavior on expected input shapes, section names, or artifacts from other agents.

Subagents must not reference other agents by name. A subagent's behavior must be fully self-contained — it should not assume which orchestrator invoked it, which agents may follow, or what role other agents play. Use role descriptions ("the implementer", "whoever follows up") rather than agent names. This keeps subagents composable and independent. Primary/orchestrating agents may reference specific subagents by name when directing work.

# OpenCode configs are standalone

**STRICT RULE:** The `opencode/` directory must be fully self-contained. Every agent, command, or instruction referenced anywhere inside `opencode/` must have a corresponding file within `opencode/`. References to Claude Code-side agents (e.g. `python-reviewer`, `rust-reviewer`, `cpp-reviewer`, `java-reviewer`) or any file that exists only outside `opencode/` are forbidden.

When adding or updating any `opencode/` file that references an agent by name, verify the agent file exists in `opencode/agents/` before committing. If it doesn't exist there, either create it or remove the reference.

# File placement

User-level Claude configuration lives at the repo root: `rules/` (loaded globally across all projects), `agents/`, `skills/`, and `settings.json`. Keep these general-purpose.

This `.claude/` directory is for **repo-specific Claude functionality**: skills or instructions that apply only when working inside this repository. When adding or modifying Claude features that are specific to managing this repo (e.g. the OpenCode sync skill), place them here in `.claude/`, not in the root `skills/` or `agents/` directories.

# Hooks

Hooks are versioned at the repo root under `hooks/` and registered in `settings.json` under the `hooks` key. When the repo is cloned to `~/.claude/`, scripts at `hooks/<name>.sh` end up at `~/.claude/hooks/<name>.sh`. Reference them from `settings.json` with the full `~/.claude/hooks/<name>.sh` path. Keep hook scripts dependency-light — assume `bash` and `jq` only — and chmod +x before committing so the executable bit survives the clone.

The CC-side `hooks/` directory is the intended counterpart to OC's `opencode/plugins/`. When adding a CC hook that mirrors an existing OC plugin (or vice versa), name them consistently and keep their match patterns in sync. Current pair: `hooks/block-secrets.sh` ↔ `opencode/plugins/block-secrets.ts`.

This repository is a versioned backup of a `~/.claude` directory for Claude Code.
It is a config repo, not a software project — there is no application to build or run.

Files here are Claude Code configuration: `CLAUDE.md` (user-level instructions),
`settings.json` (permissions and plugins), `agents/` (subagent definitions), and
`skills/` (user-invocable slash commands).

Do not treat the absence of source code as a problem to fix.

# File placement

The root `CLAUDE.md` is the **global user prompt** — it travels with the user across all projects. Keep it general-purpose.

This `.claude/` directory is for **repo-specific Claude functionality**: skills, hooks, or instructions that apply only when working inside this repository. When adding or modifying Claude features that are specific to managing this repo (e.g. the OpenCode sync skill), place them here in `.claude/`, not in the root `skills/` or `agents/` directories.

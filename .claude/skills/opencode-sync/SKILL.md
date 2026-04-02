---
description: "Reference guide for keeping Claude Code and OpenCode configs in sync"
---

# OpenCode Sync Reference

OpenCode docs: https://opencode.ai/docs

This skill documents the mapping between Claude Code configs in this repo and their OpenCode equivalents in `opencode/`. Use this as a reference when creating or modifying any config file. Consult the OpenCode docs link above when the mapping is unclear or a feature needs verification.

## Rule: Keep configs in sync

When any config file is created or modified, the corresponding OpenCode equivalent in `opencode/` must be updated in the same commit. See the mapping table below.

## Directory mapping

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `rules/general.md` | `opencode/AGENTS.md` (General Standards section) | Cross-agent content. All OC agents inherit AGENTS.md. |
| `rules/security.md` | `opencode/AGENTS.md` (Security section) | Cross-agent content. Same. |
| `rules/complex-tasks.md` | `opencode/agents/base.md` (body) | Orchestration behavior. Goes into base agent, not AGENTS.md — see Base Agent section below. |
| `settings.json` | `opencode/opencode.jsonc` | Permissions translated (see below). Plugins have no equivalent. |
| `agents/<name>.md` | `opencode/agents/<name>.md` | Same markdown format. Direct port. |
| `skills/review/SKILL.md` | `opencode/skills/review/SKILL.md` | Ported without CC-specific frontmatter (`context: fork`, `allowed-tools`). |
| `skills/review/template.md` | `opencode/skills/review/template.md` | Identical copy. |
| `skills/commit/SKILL.md` | `opencode/commands/commit/COMMAND.md` | Becomes a model-mediated command (see limitations). |
| `skills/summarize-branch/SKILL.md` | `opencode/commands/summarize-branch/COMMAND.md` | Same. |
| `skills/<name>/SKILL.md` (agent-invocable) | `opencode/skills/<name>/SKILL.md` + `opencode/commands/<name>/COMMAND.md` | Skill for agent consumption; thin command wrapper for user invocation. |

## Rules vs CLAUDE.md

Claude Code supports a `rules/` directory (mirrors `~/.claude/rules/`) as an alternative to putting everything in `CLAUDE.md`. Rules are loaded automatically at session start, same as `CLAUDE.md`, but allow content to be split by topic.

**This repo's convention:**
- `rules/` — user-level rules loaded globally across all projects (general.md, security.md, complex-tasks.md)
- `CLAUDE.md` — minimal pointer to `rules/`
- `.claude/rules/` — repo-specific rules (e.g. config-sync.md), committed via `.gitignore` exception

When adding a new user-level rule, create a new file in `rules/` rather than expanding `CLAUDE.md`.

## Base Agent (OpenCode)

OpenCode has no implicit base agent equivalent to Claude Code's default behavior. The base agent fills this role.

**The split:**
- `opencode/AGENTS.md` — content from rules that should apply to **all** agents (general standards, security). Every OC agent inherits this.
- `opencode/agents/base.md` — content specific to the **primary orchestrating agent** (complex task methodology, when to delegate to developer/reviewer). This is where `rules/complex-tasks.md` content lives in OC.

**When adding a new rule, decide:**
- Does it apply to every agent (developer, reviewer, base)? → `opencode/AGENTS.md`
- Does it describe how the primary agent should orchestrate or approach work? → `opencode/agents/base.md`

## Permissions translation

Claude Code uses three separate arrays (`deny`, `ask`, `allow`). OpenCode uses a flat map where the last matching rule wins. When translating:

1. Express `ask` rules first.
2. Express `deny` rules after — more specific deny rules must come after broader ask rules so they take precedence.

Example:
```jsonc
// Claude Code (settings.json)
"deny": ["Bash(git push --force*)"],
"ask":  ["Bash(git push*)"]

// OpenCode (opencode.jsonc) — deny must come AFTER ask to win
"permission": {
  "bash": {
    "git push*": "ask",
    "git push --force*": "deny"
  }
}
```

## Known gaps (features with no OpenCode equivalent)

| Claude Code feature | Status in OpenCode | Impact |
|--------------------|-------------------|--------|
| `disable-model-invocation: true` on skills | No equivalent | `/commit` and `/summarize-branch` become model-mediated. Still functional, less deterministic. |
| `context: fork` in skills | No direct equivalent | Context isolation is looser when reviewer agent is invoked via command. |
| `allowed-tools` per-skill | No inline allowlist on commands | Approximate via agent-level `permission` config in `opencode.json`. |
| Hooks (settings.json shell hooks) | Requires TypeScript plugin module | Not portable without writing JS/TS code in `opencode/plugins/`. |
| Official plugins (`frontend-design`, `superpowers`, `playwright`) | Claude Code-specific packages | No OpenCode equivalent. Lost. |

## When adding a new agent

1. Create `agents/<name>.md` (Claude Code)
2. Copy to `opencode/agents/<name>.md` (same content, same frontmatter)

## When adding a new skill

Determine the category first:

**Model-invocation not needed** (pure automation, `disable-model-invocation: true`):
- Create `skills/<name>/SKILL.md` (Claude Code)
- Create `opencode/commands/<name>/COMMAND.md` (same body, remove CC-specific frontmatter keys)

**Agent-invocable / model is involved**:
- Create `skills/<name>/SKILL.md` (Claude Code)
- Create `opencode/skills/<name>/SKILL.md` (remove `agent:`, `context: fork`, `allowed-tools` from frontmatter)
- Create `opencode/commands/<name>/COMMAND.md` (thin wrapper: `agent: <name>` + one-line instruction to use the skill)

## When adding a new rule

1. Create `rules/<topic>.md` (Claude Code)
2. Decide: cross-agent content or base-agent content? (see Base Agent section above)
3. Add to `opencode/AGENTS.md` (cross-agent) or `opencode/agents/base.md` (base agent)

## When modifying permissions (settings.json)

Translate the change to `opencode/opencode.json` following the ordering rules above.

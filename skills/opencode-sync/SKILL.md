---
description: "Reference guide for keeping Claude Code and OpenCode configs in sync"
---

# OpenCode Sync Reference

This skill documents the mapping between Claude Code configs in this repo and their OpenCode equivalents in `opencode/`. Use this as a reference when creating or modifying any config file.

## Rule: Keep configs in sync

When any config file is created or modified, the corresponding OpenCode equivalent in `opencode/` must be updated in the same commit. See the mapping table below.

## Directory mapping

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `CLAUDE.md` | `opencode/AGENTS.md` | Same content. OpenCode also reads `CLAUDE.md` as fallback. |
| `settings.json` | `opencode/opencode.json` | Permissions translated (see below). Plugins have no equivalent. |
| `agents/<name>.md` | `opencode/agents/<name>.md` | Same markdown format. Direct port. |
| `skills/review/SKILL.md` | `opencode/skills/review/SKILL.md` | Ported without CC-specific frontmatter (`context: fork`, `allowed-tools`). |
| `skills/review/template.md` | `opencode/skills/review/template.md` | Identical copy. |
| `skills/commit/SKILL.md` | `opencode/commands/commit/COMMAND.md` | Becomes a model-mediated command (see limitations). |
| `skills/summarize-branch/SKILL.md` | `opencode/commands/summarize-branch/COMMAND.md` | Same. |
| `skills/<name>/SKILL.md` (agent-invocable) | `opencode/skills/<name>/SKILL.md` + `opencode/commands/<name>/COMMAND.md` | Skill for agent consumption; thin command wrapper for user invocation. |

## Permissions translation

Claude Code uses three separate arrays (`deny`, `ask`, `allow`). OpenCode uses a flat map where the last matching rule wins. When translating:

1. Express `ask` rules first.
2. Express `deny` rules after — more specific deny rules must come after broader ask rules so they take precedence.

Example:
```json
// Claude Code (settings.json)
"deny": ["Bash(git push --force*)"],
"ask":  ["Bash(git push*)"]

// OpenCode (opencode.json) — deny must come AFTER ask to win
"bash(git push*)": "ask",
"bash(git push --force*)": "deny"
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

## When modifying permissions (settings.json)

Translate the change to `opencode/opencode.json` following the ordering rules above.

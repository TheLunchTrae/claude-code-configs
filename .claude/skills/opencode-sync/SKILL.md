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
| `skills/review/SKILL.md` | `opencode/skills/review/SKILL.md` + `opencode/commands/review.md` | Skill for agent use; command with `agent: reviewer` + `subtask: true` for user invocation with context isolation. |
| `skills/review/template.md` | `opencode/skills/review/template.md` | Identical copy. |
| `skills/commit/SKILL.md` | `opencode/commands/commit.md` | `disable-model-invocation` maps to OC command (see Skill Categories below). |
| `skills/summarize-branch/SKILL.md` | `opencode/commands/summarize-branch.md` | Same. |
| `skills/<name>/SKILL.md` (agent-invocable) | `opencode/skills/<name>/SKILL.md` + `opencode/commands/<name>.md` | Skill for agent consumption; thin command wrapper for user invocation. |

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

## Skill categories and their OC equivalents

### `disable-model-invocation: true` → OC command

CC skills with `disable-model-invocation: true` are pure-automation, user-initiated scripts with no agent delegation. The OC structural equivalent is a **command**: commands are `/`-invoked by the user and are not agent-discovered (agents find skills via the `skill` tool, not commands).

**Difference:** OC commands still go through the LLM — there is no true "no model" mode in OpenCode. Behavior is equivalent but less deterministic.

- Create `skills/<name>/SKILL.md` with `disable-model-invocation: true` (Claude Code)
- Create `opencode/commands/<name>.md` with the same instruction body, no CC-specific frontmatter (OpenCode)

### Agent-invocable skill, no context isolation → OC skill + thin command

- Create `skills/<name>/SKILL.md` (Claude Code)
- Create `opencode/skills/<name>/SKILL.md` — remove `agent:`, `context:`, `allowed-tools` from frontmatter; add `name:` matching the directory name
- Create `opencode/commands/<name>.md` — thin wrapper: `agent: <name>` + one-line instruction to invoke the skill

### Agent-invocable skill with `context: fork` → OC skill + command with `subtask: true`

CC's `context: fork` runs the skill in an isolated subagent context. The OC equivalent is `subtask: true` on the command, which forces the delegated agent to run as a subagent even if its `mode` is `primary`.

- Create `skills/<name>/SKILL.md` with `context: fork` (Claude Code)
- Create `opencode/skills/<name>/SKILL.md` — same as above; add a note in the body that this skill is intended to be invoked as a subagent
- Create `opencode/commands/<name>.md` with `agent: <name>` + `subtask: true`

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

## OpenCode-only agent frontmatter keys

These keys are available on OC agents (`opencode/agents/<name>.md`) with no CC equivalent. Use them where they add value:

| Key | Type | Description |
|-----|------|-------------|
| `model` | string | Override the default LLM model for this agent. Also available on commands. |
| `steps` | number | Maximum agentic iterations before the agent stops. Useful for constraining review/summarize agents. |
| `temperature` | float | Response randomness (0.0–1.0). |
| `top_p` | float | Alternative randomness control. |
| `hidden` | bool | Hide this agent from the TUI autocomplete menu. |
| `disable` | bool | Disable the agent entirely without deleting the file. |

## Known gaps (features with no OpenCode equivalent)

| Claude Code feature | Status in OpenCode | Impact |
|--------------------|-------------------|--------|
| `allowed-tools` per-skill | No inline allowlist on commands. Approximate via agent-level `permission` in `opencode.jsonc`. | Tool scope is less granular — applies to the agent globally, not per-invocation. |
| Hooks (`settings.json` shell hooks) | Requires TypeScript plugin module in `opencode/plugins/`. | Not portable without writing JS/TS code. |
| Official plugins (`frontend-design`, `superpowers`, `playwright`) | Claude Code-specific packages. | No OpenCode equivalent. Lost. |

## When adding a new agent

1. Create `agents/<name>.md` (Claude Code)
2. Copy to `opencode/agents/<name>.md` (same content, same frontmatter)

## When adding a new skill

Determine the category first — see **Skill categories** above.

**No model / pure automation** (`disable-model-invocation: true`):
- Create `skills/<name>/SKILL.md` (Claude Code)
- Create `opencode/commands/<name>.md` (same body, remove CC-specific frontmatter keys)

**Agent-invocable, no context isolation**:
- Create `skills/<name>/SKILL.md` (Claude Code)
- Create `opencode/skills/<name>/SKILL.md` (add `name:` key; remove `agent:`, `context:`, `allowed-tools`)
- Create `opencode/commands/<name>.md` (`agent: <name>` + one-line invocation instruction)

**Agent-invocable with `context: fork`**:
- Create `skills/<name>/SKILL.md` with `context: fork` (Claude Code)
- Create `opencode/skills/<name>/SKILL.md` (add `name:` key; add a note in body that it is intended for subagent invocation)
- Create `opencode/commands/<name>.md` (`agent: <name>` + `subtask: true` + one-line invocation instruction)

## When adding a new rule

1. Create `rules/<topic>.md` (Claude Code)
2. Decide: cross-agent content or base-agent content? (see Base Agent section above)
3. Add to `opencode/AGENTS.md` (cross-agent) or `opencode/agents/base.md` (base agent)

## When modifying permissions (settings.json)

Translate the change to `opencode/opencode.jsonc` following the ordering rules above.

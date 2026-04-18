---
description: "Reference guide for selective Claude Code ↔ OpenCode config mirroring in this repo"
---

# OpenCode Mirror Reference

OpenCode docs: https://opencode.ai/docs

This skill documents the mapping between Claude Code configs in this repo and their OpenCode equivalents in `opencode/`. Use this as a reference when creating or modifying any config file in the CC side and deciding what (if anything) to mirror on the OC side. Consult the OpenCode docs link above when a mapping is unclear or a feature needs verification.

## Scope — this is a selective mirror, not a clone

This skill is about **selective** CC↔OC parity inside this repo. It is not a 1:1 copy of the CC side onto OC. The files below are the hardcoded exclusions — CC-side items that must **not** be mirrored to `opencode/`. Keep this list authoritative: if a new CC file should not have an OC counterpart, add it here.

### Intentional exclusions (do not mirror to OC)

**Agents** (`agents/*.md` with no corresponding `opencode/agents/*.md`):
- `agents/cpp-developer.md`, `agents/cpp-reviewer.md`
- `agents/java-developer.md`, `agents/java-reviewer.md`
- `agents/python-developer.md`, `agents/python-reviewer.md`
- `agents/rust-developer.md`, `agents/rust-reviewer.md`

**Rules** (`.claude/rules/*.md` with no `opencode/AGENTS.md` counterpart — these are repo-local rules for authoring in this repo, not general-purpose CC rules):
- `.claude/rules/agent-prompt-body.md`
- `.claude/rules/agent-registration.md`
- `.claude/rules/config-sync.md`
- `.claude/rules/frontmatter-description.md`
- `.claude/rules/sync-configs-manifest.md`

**Rules** (`rules/*.md` that are CC-only — behavior described has no OpenCode analog):
- `rules/git-claude-code.md` — Claude Code's session-link commit trailer; OpenCode does not emit this.

**Skills** (CC-side skills with no `opencode/skills/` or `opencode/commands/` counterpart):
- `.claude/skills/opencode-mirror/` — this skill itself. It exists to support authoring inside this repo; an OC session on a downstream install has no use for it.

**Hooks** — not versioned on either side. No hook entries exist here and no `opencode/.claude/CLAUDE.md` hook entries exist on the OC side. Do not add any.

**Plugins** — OC plugins (`opencode/plugins/*.ts`) have no CC counterpart because CC's plugin system is npm-package-based and unrelated. This is a deliberate asymmetry, not an omission.

**Plugin-specific guidance lives in plugin tool descriptions, not AGENTS.md** — the `memory` plugin (`opencode/plugins/memory.ts`) carries its when-to-write / when-not-to-write rules inside the `memory_write` tool description. There is no corresponding section in `opencode/AGENTS.md`, and no CC-side rule to mirror — the model picks up the guidance from the tool schema at call time.

When a CC config change lands in a category that *is* mirrored (anything not in the list above), the matching OC file must be updated in the same commit. Use the mapping table below to find the right OC target.

### Not to be confused with `/sync-configs`

`/sync-configs` (`opencode/.opencode/commands/sync-configs.md`) is a completely different tool. It is an OC-side command that always fetches its manifest from `opencode/.opencode/sync-configs-manifest.md` on `raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/` and then webfetches every file listed in it into a downstream install, with diff/merge for local customizations. That manifest must be comprehensive — every file under `opencode/` that OC reads at runtime appears in it. Do not use this skill's hardcoded exclusion list as a reason to leave anything out of that manifest.

## Rule: keep mirrored categories in sync

When any config file in a mirrored category is created or modified, the corresponding OpenCode equivalent in `opencode/` must be updated in the same commit. See the mapping table below.

## Directory mapping

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `rules/*.md` (cross-agent) | `opencode/AGENTS.md` (a single coalesced file) | OpenCode reads `AGENTS.md` automatically — no `instructions` array needed. The CC side keeps one file per topic under `rules/`; the OC side concatenates them into `AGENTS.md` under topic headings (`# General`, `# Security`, `# Coding Style`, `# Code Review`, `# Testing`, `# Patterns`, `# Agents`, etc.). |
| `settings.json` | `opencode/opencode.jsonc` | Permissions translated (see below). Plugins have no equivalent. |
| _(none — OpenCode-only)_ | `opencode/plugins/*.ts` | Authored OpenCode plugins. Auto-discovered at session start. No Claude Code equivalent — CC's plugin system is npm-package-based and unrelated. |
| _(none — OpenCode-only)_ | `opencode/package.json`, `opencode/tsconfig.json` | Manifest + tsconfig so `bun install` resolves plugin SDK + types at the OC config root. |
| `agents/<name>.md` | `opencode/agents/<name>.md` | Same markdown format. Direct port. |
| `skills/review/SKILL.md` | `opencode/skills/review/SKILL.md` + `opencode/commands/review.md` | Skill for agent use; command with `agent: code-reviewer` + `subtask: true` for user invocation with context isolation. |
| `skills/review/template.md` | `opencode/skills/review/template.md` | Identical copy. |
| `skills/commit/SKILL.md` | `opencode/commands/commit.md` | `disable-model-invocation` maps to OC command (see Skill Categories below). |
| `skills/summarize-branch/SKILL.md` | `opencode/commands/summarize-branch.md` | Same. |
| `skills/<name>/SKILL.md` (agent-invocable) | `opencode/skills/<name>/SKILL.md` + `opencode/commands/<name>.md` | Skill for agent consumption; thin command wrapper for user invocation. |

## Rules vs CLAUDE.md

Claude Code supports a `rules/` directory (mirrors `~/.claude/rules/`) as an alternative to putting everything in `CLAUDE.md`. Rules are loaded automatically at session start from `rules/*.md`, so no root `CLAUDE.md` pointer is required.

**This repo's convention:**
- `rules/` — user-level rules loaded globally across all projects (general.md, security.md, etc.)
- `.claude/rules/` — repo-specific rules (e.g. config-sync.md), committed via `.gitignore` exception
- No root `CLAUDE.md` — content is split across `rules/*.md` files by topic

When adding a new user-level rule, create a new file in `rules/`.

## Lead Agent (OpenCode)

OpenCode has no implicit primary agent equivalent to Claude Code's default behavior. The lead agent fills this role.

**The split:**
- `opencode/AGENTS.md` — rules that apply to **all** agents. OpenCode reads this file automatically from the `opencode/` root; no `instructions` array or loader wiring is needed. Sections are topic-headed (`# General`, `# Security`, etc.).
- `opencode/agents/lead.md` — workflow behavior and the subagent registry (which agents exist and when to invoke them). Only the primary agent reads this file, so the registry does not leak into subagent contexts.

**When adding a new rule, decide:**
- Does it apply to every agent? → add a new section (or extend an existing one) in `opencode/AGENTS.md`
- Does it describe how the primary agent should orchestrate or approach work, or which subagents to invoke? → `opencode/agents/lead.md`
- Is it plugin-specific guidance (designs, memory)? → expand the relevant plugin's tool description in `opencode/plugins/*.ts`. Plugin rules should not live in `AGENTS.md`.

### OC-only content (no Claude Code analog)

Claude Code's main session auto-discovers agents via their YAML `description` fields, so no explicit registry is needed on the CC side. `opencode/agents/lead.md` has no Claude Code counterpart — changes to the registry or orchestration in `lead.md` do NOT sync to a CC file. This is an OC-only concern.

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

Claude Code uses three separate arrays (`allow`, `ask`, `deny`). OpenCode uses a single flat map matched top-down where the last matching pattern wins. When translating, flatten the three arrays into one map and order them so precedence is preserved:

1. Express `allow` rules first (broadest — overridden by anything later).
2. Express `ask` rules next.
3. Express `deny` rules last (most restrictive — takes precedence over everything above).
4. Sort alphabetically within each group.

Example:
```jsonc
// Claude Code (settings.json)
"allow": ["Bash(git status*)"],
"ask":   ["Bash(git push*)"],
"deny":  ["Bash(git push --force*)"]

// OpenCode (opencode.jsonc) — allow → ask → deny, each group alpha-sorted
"permission": {
  "bash": {
    "git status*": "allow",
    "git push*": "ask",
    "git push --force*": "deny"
  }
}
```

## OpenCode-only agent frontmatter keys

These keys are available on OC agents (`opencode/agents/<name>.md`) with no CC equivalent. Use them where they add value:

| Key | Type | Description |
|-----|------|-------------|
| `color` | string | Hex color (e.g. `"#8AF793"`) for the agent's accent in the TUI. |
| `model` | string | Override the default LLM model for this agent. Also available on commands. |
| `steps` | number | Maximum agentic iterations before the agent stops. Useful for constraining review/summarize agents. |
| `temperature` | float | Response randomness (0.0–1.0). |
| `top_p` | float | Alternative randomness control. |
| `hidden` | bool | Hide this agent from the TUI autocomplete menu. |
| `mode` | string | Set to `"subagent"` to restrict the agent to invocation by other agents only — not selectable as a primary agent by the user. |
| `disable` | bool | Disable the agent entirely without deleting the file. |
| `permission` | map | Nested `edit` / `bash` / `webfetch` / `task` keys set to `allow` / `ask` / `deny`. Overrides the global permission block in `opencode.jsonc`. |

## Claude Code-only agent frontmatter keys (strip when mirroring)

These keys exist on the CC side and are **not** valid OpenCode frontmatter. They must be removed (or translated) when copying an agent into `opencode/agents/`:

| CC key | OC translation |
|--------|----------------|
| `tools: ["Read", "Grep", "Glob"]` (read-only) | `permission: { edit: deny, bash: deny }` |
| `tools: ["Read", "Grep", "Glob", "Bash"]` (read + bash) | `permission: { edit: deny }` |
| `tools: [Read, Write, Edit, Bash, Grep, Glob]` (full access) | drop entirely — no OC override needed |

OpenCode silently ignores unknown keys, so leaving `tools:` in place will not raise an error but will cause tool-restriction intent to be lost — the agent runs with whatever the global `opencode.jsonc` permission block allows. Always translate. See `opencode/.claude/CLAUDE.md` → "Frontmatter schema for agents, commands, and skills" for the full OC schema.

## Known gaps (features with no OpenCode equivalent)

| Claude Code feature | Status in OpenCode | Impact |
|--------------------|-------------------|--------|
| `allowed-tools` per-skill | No inline allowlist on commands. Approximate via agent-level `permission` in `opencode.jsonc`. | Tool scope is less granular — applies to the agent globally, not per-invocation. |
| Official Claude Code plugins (`frontend-design`, `superpowers`, `playwright`) | CC-specific packages with no OC equivalent. | Lost on the OC side. Authored OC plugins live in `opencode/plugins/` but are not a substitute. |

## When adding a new agent

1. Create `agents/<name>.md` (Claude Code)
2. Copy the body into `opencode/agents/<name>.md`. The **body** is identical; the **frontmatter is not** — strip CC-only keys (`tools:`) and translate to the OC equivalent (`permission:`) per the "Claude Code-only agent frontmatter keys" table above. Consult `opencode/.claude/CLAUDE.md` → "Frontmatter schema for agents, commands, and skills" for the full list of valid OC keys before committing.

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

1. Create `rules/<topic>.md` (Claude Code) + symlink `.claude/rules/<topic>.md`
2. Decide: cross-agent content or lead-agent content? (see Lead Agent section above)
3. Cross-agent: add a new `# <Topic>` section in `opencode/AGENTS.md` with the rule body
4. Lead-agent: add content to `opencode/agents/lead.md`
5. Plugin-specific: expand the tool description in the relevant `opencode/plugins/*.ts` file instead

## When modifying permissions (settings.json)

Translate the change to `opencode/opencode.jsonc` following the ordering rules above.

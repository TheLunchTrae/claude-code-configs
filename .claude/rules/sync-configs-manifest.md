# Sync-configs Manifest

This rule governs `opencode/.opencode/commands/sync-configs.md` — the **OC distribution command** `/sync-configs`, which webfetches OC configs from GitHub into a downstream install (for environments where cloning the repo isn't an option). It is **not** the same as the CC-side `/opencode-mirror` skill, which is a selective within-repo mirror used while authoring configs; see `.claude/skills/opencode-mirror/SKILL.md` for the hardcoded CC↔OC exclusion list. `/sync-configs` must list every OC file verbatim so nothing is missed on fetch.

`opencode/.opencode/commands/sync-configs.md` lists every file the `/sync-configs` command propagates from this repo to a user's local OpenCode install. The manifest must mirror the current OC file tree — newly added files won't ship without an entry, and removed files cause 404s during sync.

## When to update

Update the manifest in the **same commit** as any of these changes to `opencode/`:

- **Add** — a new file in a tracked location creates an entry under the corresponding section.
- **Remove** — a deleted file's entry must be removed in the same commit.
- **Rename / move** — change the entry's `Remote` and `Local` paths to match the new location.

## Scope

The manifest must include **every file under `opencode/`** that OpenCode reads at runtime. `/sync-configs` is the distribution mechanism for a user's OC install — anything missing from the manifest won't reach the user.

| Section | Location | Includes |
|---------|----------|----------|
| Config | `opencode/` root | `opencode.jsonc` and any future top-level config files |
| Instructions | `opencode/instructions/` | every `*.md` |
| Agents | `opencode/agents/` | every `*.md` — meta agents, reviewers, language developers, framework developers, specialists |
| Commands | `opencode/commands/` + `opencode/.opencode/commands/` | every `*.md` (including `sync-configs.md` itself) |
| Skills | `opencode/skills/` | every `*/SKILL.md` and any companion files (e.g. `template.md`) |
| Plugins | `opencode/plugins/` + root | every `plugins/*.ts` plus `package.json` and `tsconfig.json` |

## Excluded by design

`opencode/.claude/CLAUDE.md` is NOT in the manifest — it is read only by Claude Code agents working inside this config repo and is not part of a user-level OpenCode install. Build artifacts and lockfiles under `opencode/` are also out of scope.

## Cross-references

- `.claude/rules/agent-registration.md` — full per-agent update checklist; every new OpenCode agent needs a manifest row.
- `opencode/.claude/CLAUDE.md` — its plugin-registry section also requires that any new plugin be added to the Plugins manifest section here.

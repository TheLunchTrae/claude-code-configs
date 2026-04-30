# Sync-configs Manifest

This rule governs `opencode/.opencode/sync-configs-manifest.json` — the manifest used by the **OC distribution command** `/sync-configs`, which webfetches OC configs from GitHub into a downstream install (for environments where cloning the repo isn't an option). It is **not** the same as the CC-side `/opencode-mirror` skill, which is a selective within-repo mirror used while authoring configs; see `.claude/skills/opencode-mirror/SKILL.md` for the hardcoded CC↔OC exclusion list. `/sync-configs` always fetches this manifest from upstream before syncing, so the manifest must list every OC file verbatim — anything missing won't reach the user.

`opencode/.opencode/sync-configs-manifest.json` is a JSON document containing every path under `opencode/` that should ship to user installs, plus a `version` integer. The plugin at `opencode/.opencode/plugins/sync-configs.ts` `JSON.parse`s it, flattens `paths` (an object whose values are string arrays per category) into a single sync list, and applies `deleted` as a tombstone set. The slash command file (`opencode/.opencode/commands/sync-configs.md`) contains only the plan/apply orchestration procedure and never reads the manifest itself. The manifest must mirror the current OC file tree — newly added files won't ship without an entry, and removed files cause 404s during sync unless they are moved to the `deleted` array.

## Schema

```json
{
  "version": <integer>,
  "paths": {
    "config":   ["<path relative to opencode/>", ...],
    "agents":   [...],
    "commands": [...],
    "skills":   [...],
    "plugins":  [...]
  },
  "deleted": ["<path>", ...]
}
```

The keys under `paths` are descriptive labels for human readability — the plugin flattens via `Object.values(paths).flat()` and treats every string the same. Adding a new category key (e.g. `"hooks"`) requires no plugin change; it just becomes part of the sync list.

## When to update

Update the manifest in the **same PR** as any of these changes to `opencode/`. Entry changes (add/delete/rename) must land in the same commit as the underlying file change so the manifest always matches the tree at every commit; the version bump only needs to happen once per PR.

- **Bump `version`** — bump the integer by exactly 1 per PR that changes a manifest-tracked file (content or membership) or the manifest itself, regardless of how many commits in the PR touch tracked files. PRs merge atomically so one bump per PR is sufficient, and staging multiple bumps across intermediate commits just adds noise. `/sync-configs` uses this value to short-circuit when nothing has changed since the user's last sync, so the bump is what causes downstream users to pull your change.
- **Add** — a new file in a tracked location creates an entry under the appropriate `paths.<category>` array.
- **Delete** — **move** the file's path from its current `paths.<category>` array into the `deleted` array (do not just remove it). Entries stay in `deleted` indefinitely so users whose last-synced version predates the delete still have it applied when they next run `/sync-configs`. If the same path is later re-added to `opencode/`, remove the `deleted` entry in the same commit that re-adds it.
- **Rename / move** — update the existing entry's path to match the new location, and add the old path to `deleted` so user installs lose the stale file.

## Scope

The manifest must include **every file under `opencode/`** that OpenCode reads at runtime. `/sync-configs` is the distribution mechanism for a user's OC install — anything missing from the manifest won't reach the user.

| `paths` key | Location | Includes |
|-------------|----------|----------|
| `config`   | `opencode/` root | `opencode.jsonc`, `AGENTS.md`, and any future top-level config files |
| `agents`   | `opencode/agents/` | every `*.md` — meta agents, reviewers, language developers, framework developers, specialists |
| `commands` | `opencode/commands/` + `opencode/.opencode/commands/` | every `*.md` (including `sync-configs.md` itself) plus `opencode/.opencode/README.md` |
| `skills`   | `opencode/skills/` | every `*/SKILL.md` and any companion files (e.g. `template.md`) |
| `plugins`  | `opencode/plugins/` + `opencode/.opencode/plugins/` + root | every `plugins/*.ts` and `.opencode/plugins/*.ts` plus `tsconfig.json` |
| `deleted`  | any path previously tracked | paths removed from the OC tree; never pruned |

## Excluded by design

- `opencode/.opencode/sync-configs-manifest.json` — the manifest itself. `/sync-configs` always fetches the manifest directly from upstream before reading any entries, so listing it in the manifest would be redundant; the local copy is never consulted.
- `opencode/.claude/CLAUDE.md` — read only by Claude Code agents working inside this config repo, not part of a user-level OpenCode install.
- `opencode/package.json` — OpenCode generates one automatically at runtime on a user's install, so syncing the repo copy would clobber it. The committed file stays in the repo only so contributors can run `bun install` locally for plugin-authoring IDE support.
- Build artifacts and lockfiles under `opencode/`.

## Cross-references

- `.claude/rules/agent-registration.md` — full per-agent update checklist; every new OpenCode agent needs a manifest entry.
- `opencode/.claude/CLAUDE.md` — its plugin-registry section also requires that any new plugin be added to `paths.plugins` here.

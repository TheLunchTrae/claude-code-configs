# Sync-configs Manifest

`opencode/.opencode/commands/sync-configs.md` lists every file the `/sync-configs` command propagates from this repo to a user's local OpenCode install. The manifest must mirror the current OC file tree — newly added files won't ship without an entry, and removed files cause 404s during sync.

## When to update

Update the manifest in the **same commit** as any of these changes to `opencode/`:

- **Add** — a new file in a tracked location creates an entry under the corresponding section.
- **Remove** — a deleted file's entry must be removed in the same commit.
- **Rename / move** — change the entry's `Remote` and `Local` paths to match the new location.

## Section scope

Each section maps to a fixed location in `opencode/`:

| Section | Includes | Excludes |
|---------|----------|----------|
| Config | `opencode.jsonc` and any future top-level config files | — |
| Instructions | every `instructions/*.md` | — |
| Agents | cross-stack agents only (architect, planner, code-reviewer, security-reviewer, code-simplifier, refactor-cleaner, doc-updater, mcp-builder, the CI developers, lead, performance-optimizer) | language-specific developers/reviewers; framework developers (`react-`, `doctrine-`, `efcore-`, `laminas-`); cross-stack agents that require external dependencies not present in every install (e.g. `e2e-runner` needs Playwright) |
| Commands | every `commands/*.md` plus `.opencode/commands/sync-configs.md` itself | — |
| Skills | every `skills/*/SKILL.md` and any companion files (e.g. `template.md`) | — |
| Plugins | every `plugins/*.ts` plus `package.json` and `tsconfig.json` | build artifacts, lockfiles |

## Excluded by design

Repo-scoped Claude Code files under `.claude/` (this repo's CLAUDE.md, repo-only rules, hooks) are NOT in the manifest — they apply only when working inside this config repo and are not part of a user-level OpenCode install.

## Cross-references

- `.claude/rules/agent-registration.md` — full per-agent update checklist; the manifest entry is one bullet of that workflow when the new agent is cross-stack.
- `opencode/.claude/CLAUDE.md` — its plugin-registry section also requires that any new plugin be added to the Plugins manifest section here.

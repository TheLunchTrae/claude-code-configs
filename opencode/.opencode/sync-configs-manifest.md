# Files synced by `/sync-configs`

Paths are relative to the `opencode/` directory in the upstream repo, and are written to the same relative path in the local OpenCode config tree.

Any line matching `^- <path>` contributes a path to the sync manifest. Section headers are for human readability only, except `## Deleted` — paths under that section are removed from the local tree rather than fetched.

`Version:` is a monotonically increasing integer bumped on every commit that changes a manifest-tracked file or the manifest itself. `/sync-configs` compares it against the last-synced version to decide whether any work is needed.

Version: 3

## Config
- opencode.jsonc
- AGENTS.md
- README.md

## Agents
- agents/README.md
- agents/lead.md
- agents/architect.md
- agents/planner.md
- agents/security-reviewer.md
- agents/code-reviewer.md
- agents/code-simplifier.md
- agents/refactor-cleaner.md
- agents/doc-updater.md
- agents/mcp-builder.md
- agents/github-actions-developer.md
- agents/gitlab-ci-developer.md
- agents/performance-optimizer.md
- agents/csharp-developer.md
- agents/csharp-reviewer.md
- agents/go-developer.md
- agents/go-reviewer.md
- agents/php-developer.md
- agents/php-reviewer.md
- agents/typescript-developer.md
- agents/typescript-reviewer.md
- agents/doctrine-developer.md
- agents/efcore-developer.md
- agents/laminas-developer.md
- agents/react-developer.md

## Commands
- commands/README.md
- commands/commit.md
- commands/commit-push.md
- commands/push.md
- commands/plan.md
- commands/review.md
- commands/security-review.md
- commands/summarize-branch.md
- commands/handoff.md
- commands/catchup.md
- commands/design.md
- commands/cleanup-artifacts.md
- commands/code-review.md
- commands/update-docs.md
- commands/verify.md
- commands/orchestrate.md
- commands/refactor-clean.md
- commands/go-review.md
- .opencode/commands/sync-configs.md
- .opencode/README.md

## Skills
- skills/README.md
- skills/plan/SKILL.md
- skills/review/SKILL.md
- skills/review/template.md
- skills/security-review/SKILL.md
- skills/security-review/references/owasp-2021.md

## Plugins
- plugins/README.md
- plugins/artifacts.ts
- plugins/block-secrets.ts
- plugins/lib/project.ts
- plugins/memory.ts
- tsconfig.json

## Deleted

Paths that were previously synced and should now be removed from the local OpenCode config tree. Entries stay here indefinitely so users whose last-synced version predates the deletion still have it applied when they next run `/sync-configs`.


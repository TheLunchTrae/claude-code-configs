Sync OpenCode config files from the upstream GitHub repo into this project directory.

Base URL: `https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/`
Local base: `.` (project root — the directory containing this `.opencode/` folder)

Remote paths below are relative to the `opencode/` directory in the repo; local paths are relative to the project root.

## File manifest

### Config
| Remote | Local |
|--------|-------|
| `opencode.jsonc` | `opencode.jsonc` |

### Instructions
| Remote | Local |
|--------|-------|
| `instructions/general.md` | `instructions/general.md` |
| `instructions/security.md` | `instructions/security.md` |
| `instructions/accuracy.md` | `instructions/accuracy.md` |
| `instructions/code-review.md` | `instructions/code-review.md` |
| `instructions/coding-style.md` | `instructions/coding-style.md` |
| `instructions/agents.md` | `instructions/agents.md` |
| `instructions/testing.md` | `instructions/testing.md` |
| `instructions/patterns.md` | `instructions/patterns.md` |
| `instructions/performance.md` | `instructions/performance.md` |

### Agents
| Remote | Local |
|--------|-------|
| `agents/lead.md` | `agents/lead.md` |
| `agents/architect.md` | `agents/architect.md` |
| `agents/planner.md` | `agents/planner.md` |
| `agents/security-reviewer.md` | `agents/security-reviewer.md` |
| `agents/code-reviewer.md` | `agents/code-reviewer.md` |
| `agents/code-simplifier.md` | `agents/code-simplifier.md` |
| `agents/refactor-cleaner.md` | `agents/refactor-cleaner.md` |
| `agents/doc-updater.md` | `agents/doc-updater.md` |
| `agents/mcp-builder.md` | `agents/mcp-builder.md` |
| `agents/github-actions-developer.md` | `agents/github-actions-developer.md` |
| `agents/gitlab-ci-developer.md` | `agents/gitlab-ci-developer.md` |
| `agents/performance-optimizer.md` | `agents/performance-optimizer.md` |
| `agents/csharp-developer.md` | `agents/csharp-developer.md` |
| `agents/csharp-reviewer.md` | `agents/csharp-reviewer.md` |
| `agents/go-developer.md` | `agents/go-developer.md` |
| `agents/go-reviewer.md` | `agents/go-reviewer.md` |
| `agents/php-developer.md` | `agents/php-developer.md` |
| `agents/php-reviewer.md` | `agents/php-reviewer.md` |
| `agents/typescript-developer.md` | `agents/typescript-developer.md` |
| `agents/typescript-reviewer.md` | `agents/typescript-reviewer.md` |
| `agents/doctrine-developer.md` | `agents/doctrine-developer.md` |
| `agents/efcore-developer.md` | `agents/efcore-developer.md` |
| `agents/laminas-developer.md` | `agents/laminas-developer.md` |
| `agents/react-developer.md` | `agents/react-developer.md` |

### Commands
| Remote | Local |
|--------|-------|
| `commands/commit.md` | `commands/commit.md` |
| `commands/commit-push.md` | `commands/commit-push.md` |
| `commands/push.md` | `commands/push.md` |
| `commands/plan.md` | `commands/plan.md` |
| `commands/review.md` | `commands/review.md` |
| `commands/security-review.md` | `commands/security-review.md` |
| `commands/summarize-branch.md` | `commands/summarize-branch.md` |
| `commands/handoff.md` | `commands/handoff.md` |
| `commands/catchup.md` | `commands/catchup.md` |
| `commands/cleanup-artifacts.md` | `commands/cleanup-artifacts.md` |
| `commands/code-review.md` | `commands/code-review.md` |
| `commands/update-docs.md` | `commands/update-docs.md` |
| `commands/verify.md` | `commands/verify.md` |
| `commands/orchestrate.md` | `commands/orchestrate.md` |
| `commands/refactor-clean.md` | `commands/refactor-clean.md` |
| `commands/go-review.md` | `commands/go-review.md` |
| `.opencode/commands/sync-configs.md` | `.opencode/commands/sync-configs.md` |

### Skills
| Remote | Local |
|--------|-------|
| `skills/plan/SKILL.md` | `skills/plan/SKILL.md` |
| `skills/review/SKILL.md` | `skills/review/SKILL.md` |
| `skills/review/template.md` | `skills/review/template.md` |
| `skills/security-review/SKILL.md` | `skills/security-review/SKILL.md` |

### Plugins
| Remote | Local |
|--------|-------|
| `plugins/artifacts.ts` | `plugins/artifacts.ts` |
| `plugins/block-secrets.ts` | `plugins/block-secrets.ts` |
| `package.json` | `package.json` |
| `tsconfig.json` | `tsconfig.json` |

After any change to the Plugins section, prompt the user to run `bun install` in the OpenCode config root so plugin dependencies (`@opencode-ai/plugin`, types) are resolved before the next session.

## Sync procedure

Process each file in the manifest sequentially:

1. **Fetch** the remote file via `curl` to the full raw URL (`<Base URL><Remote>`). If the fetch fails (non-200 or network error), skip the file and add it to the failures list — do not abort the whole run.

2. **Compare** the fetched content to the local file:
   - **Identical** — skip, add to unchanged list.
   - **Local file missing** — write the remote content directly, add to updated list.
   - **Different** — proceed to step 3.

3. **Merge** when content differs:
   - Prefer remote content as the base.
   - Scan the local file for sections, lines, or blocks absent from the remote. For each local-only addition, judge intent:
     - **Preserve** if the addition is clearly a local customization (environment-specific tool references, local paths, workspace-specific notes).
     - **Drop** if it appears to be content the remote has since removed or superseded.
   - If the diff is large, touches core workflow behavior, or the intent of a local addition is ambiguous, **pause and ask the user** before writing anything for that file. Show a brief summary of what differs. Wait for their instruction before continuing with that file.
   - Once the merged content is determined, write the file and add it to the updated list.

4. After all files are processed, print a final report:

```
## Sync complete

**Updated** (N):
- path/to/file.md

**Unchanged** (N):
- path/to/file.md

**Failed to fetch** (N):
- path/to/file.md — <reason>
```

Omit the failures section if there were none.

## Notes

- `opencode.jsonc` contains local permission customizations. Treat any change to the `permission` block as potentially significant and ask the user before applying it.

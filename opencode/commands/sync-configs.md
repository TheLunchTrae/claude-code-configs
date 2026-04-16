Sync OpenCode config files from the upstream GitHub repo.

Base URL: `https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/`
Local base: `~/.claude/`

## File manifest

### Config
| Remote path | Local path |
|-------------|------------|
| `opencode/AGENTS.md` | `~/.claude/opencode/AGENTS.md` |
| `opencode/opencode.jsonc` | `~/.claude/opencode/opencode.jsonc` |

### Instructions
| Remote path | Local path |
|-------------|------------|
| `opencode/instructions/general.md` | `~/.claude/opencode/instructions/general.md` |
| `opencode/instructions/security.md` | `~/.claude/opencode/instructions/security.md` |
| `opencode/instructions/accuracy.md` | `~/.claude/opencode/instructions/accuracy.md` |
| `opencode/instructions/git-workflow.md` | `~/.claude/opencode/instructions/git-workflow.md` |
| `opencode/instructions/code-review.md` | `~/.claude/opencode/instructions/code-review.md` |
| `opencode/instructions/coding-style.md` | `~/.claude/opencode/instructions/coding-style.md` |
| `opencode/instructions/development-workflow.md` | `~/.claude/opencode/instructions/development-workflow.md` |
| `opencode/instructions/testing.md` | `~/.claude/opencode/instructions/testing.md` |
| `opencode/instructions/patterns.md` | `~/.claude/opencode/instructions/patterns.md` |
| `opencode/instructions/performance.md` | `~/.claude/opencode/instructions/performance.md` |

### Agents
| Remote path | Local path |
|-------------|------------|
| `opencode/agents/lead.md` | `~/.claude/opencode/agents/lead.md` |
| `opencode/agents/architect.md` | `~/.claude/opencode/agents/architect.md` |
| `opencode/agents/planner.md` | `~/.claude/opencode/agents/planner.md` |
| `opencode/agents/security-reviewer.md` | `~/.claude/opencode/agents/security-reviewer.md` |
| `opencode/agents/code-reviewer.md` | `~/.claude/opencode/agents/code-reviewer.md` |
| `opencode/agents/code-simplifier.md` | `~/.claude/opencode/agents/code-simplifier.md` |
| `opencode/agents/build-error-resolver.md` | `~/.claude/opencode/agents/build-error-resolver.md` |
| `opencode/agents/refactor-cleaner.md` | `~/.claude/opencode/agents/refactor-cleaner.md` |
| `opencode/agents/doc-updater.md` | `~/.claude/opencode/agents/doc-updater.md` |

### Commands
| Remote path | Local path |
|-------------|------------|
| `opencode/commands/commit.md` | `~/.claude/opencode/commands/commit.md` |
| `opencode/commands/commit-push.md` | `~/.claude/opencode/commands/commit-push.md` |
| `opencode/commands/push.md` | `~/.claude/opencode/commands/push.md` |
| `opencode/commands/plan.md` | `~/.claude/opencode/commands/plan.md` |
| `opencode/commands/review.md` | `~/.claude/opencode/commands/review.md` |
| `opencode/commands/security.md` | `~/.claude/opencode/commands/security.md` |
| `opencode/commands/summarize-branch.md` | `~/.claude/opencode/commands/summarize-branch.md` |
| `opencode/commands/checkpoint.md` | `~/.claude/opencode/commands/checkpoint.md` |
| `opencode/commands/quality-gate.md` | `~/.claude/opencode/commands/quality-gate.md` |
| `opencode/commands/handoff.md` | `~/.claude/opencode/commands/handoff.md` |
| `opencode/commands/catchup.md` | `~/.claude/opencode/commands/catchup.md` |
| `opencode/commands/cleanup-artifacts.md` | `~/.claude/opencode/commands/cleanup-artifacts.md` |
| `opencode/commands/sync-configs.md` | `~/.claude/opencode/commands/sync-configs.md` |
| `opencode/commands/build-fix.md` | `~/.claude/opencode/commands/build-fix.md` |
| `opencode/commands/code-review.md` | `~/.claude/opencode/commands/code-review.md` |
| `opencode/commands/update-docs.md` | `~/.claude/opencode/commands/update-docs.md` |
| `opencode/commands/verify.md` | `~/.claude/opencode/commands/verify.md` |
| `opencode/commands/orchestrate.md` | `~/.claude/opencode/commands/orchestrate.md` |
| `opencode/commands/refactor-clean.md` | `~/.claude/opencode/commands/refactor-clean.md` |
| `opencode/commands/e2e.md` | `~/.claude/opencode/commands/e2e.md` |
| `opencode/commands/go-build.md` | `~/.claude/opencode/commands/go-build.md` |
| `opencode/commands/go-review.md` | `~/.claude/opencode/commands/go-review.md` |
| `opencode/commands/rust-build.md` | `~/.claude/opencode/commands/rust-build.md` |

### Skills
| Remote path | Local path |
|-------------|------------|
| `opencode/skills/commit/SKILL.md` | `~/.claude/opencode/skills/commit/SKILL.md` |
| `opencode/skills/commit-push/SKILL.md` | `~/.claude/opencode/skills/commit-push/SKILL.md` |
| `opencode/skills/push/SKILL.md` | `~/.claude/opencode/skills/push/SKILL.md` |
| `opencode/skills/review/SKILL.md` | `~/.claude/opencode/skills/review/SKILL.md` |
| `opencode/skills/review/template.md` | `~/.claude/opencode/skills/review/template.md` |

## Sync procedure

Process each file in the manifest sequentially:

1. **Fetch** the remote file with a bash `curl` or `wget` call to the full raw URL. If the fetch fails (non-200, network error), skip the file and add it to the failures list — do not abort the whole run.

2. **Compare** the fetched content to the local file (read the local file if it exists):
   - **Identical** — skip, add to unchanged list.
   - **Local file missing** — write the remote content directly, add to updated list.
   - **Different** — proceed to step 3.

3. **Merge** when content differs:
   - Prefer remote content as the base.
   - Scan the local file for sections, lines, or blocks that do not exist in the remote. For each local-only addition, judge intent:
     - **Preserve** if the addition is clearly a local customization (environment-specific tool references, local paths, workspace-specific notes, additions to the `opencode/.claude/CLAUDE.md` work environment section).
     - **Drop** if the addition appears to be leftover content that the remote has since removed or superseded.
   - If the diff is large, touches core workflow behavior, or the intent of a local addition is ambiguous, **pause and ask the user** before writing anything for that file. Show a brief summary of what differs and what you are unsure about. Wait for their instruction before continuing with that file.
   - Once the merged content is determined, write the file and add it to the updated list.

4. After all files are processed, print a final report:

```
## Sync complete

**Updated** (N):
- path/to/file.md
- ...

**Unchanged** (N):
- path/to/file.md
- ...

**Failed to fetch** (N):
- path/to/file.md — <reason>
- ...
```

If there were no failures, omit the failures section.

## Notes

- If `~/.claude/` does not exist or does not look like the config repo (no `opencode/opencode.jsonc`), stop and tell the user before fetching anything.
- The `opencode/.claude/CLAUDE.md` file is intentionally excluded from this manifest — it contains local environment notes that should not be overwritten.
- `opencode/opencode.jsonc` contains local permission customizations. Treat any change to the `permission` block as potentially significant and ask the user before applying it.

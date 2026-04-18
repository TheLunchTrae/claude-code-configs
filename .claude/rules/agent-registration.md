# Agent Registration

When adding, renaming, or removing an agent in this repo, update every instruction file and registry that references agents so the change is discoverable. A new agent that isn't in the registries won't be picked by the router.

## Claude Code

- `rules/agents.md` — add a row to the **Available subagents** registry table at the top, AND a row to the appropriate Implement-step table further down. Language-specific developers go in the language-developer table; cross-stack utilities (e.g. `mcp-builder`, `github-actions-developer`) go in the Cross-stack specialists table; framework developers go in the Framework table alongside their base language-developer.
- `rules/code-review.md` — add a row to the Agent Usage table when the new agent is a reviewer.

## OpenCode

- `opencode/AGENTS.md` — mirror the Claude Code change for any agent that also exists on the OpenCode side. Update both the Available subagents registry (in the `# Agents` section) and the `# Code Review` section if the new agent is a reviewer.
- `opencode/agents/lead.md` — add a row to the Available subagents registry, grouped near related agents (language reviewers together, developers together, cross-stack utilities together).
- `opencode/.opencode/sync-configs-manifest.md` — add a manifest entry for every new OpenCode agent so it ships via `/sync-configs` to user installs. See `.claude/rules/sync-configs-manifest.md`.

## Verify before committing

Confirm the new agent name appears in the Available subagents registry of `rules/agents.md` (CC) and `opencode/AGENTS.md` (OC) on every side it exists, and in `lead.md` if it exists on the OpenCode side.

## Related rules

- `.claude/rules/frontmatter-description.md` — what to put in the `description` field.
- `.claude/rules/agent-prompt-body.md` — conventions for the prompt body (role frame, task context, worked examples, CC/OC parity).

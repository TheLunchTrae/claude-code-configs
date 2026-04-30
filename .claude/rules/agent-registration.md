# Agent Registration

When adding, renaming, or removing an agent, update the registry that lists it so the change is discoverable. A new agent that isn't in the matching registry file won't be picked by orchestration.

## Where the registries live

The roster of subagents lives in the `available-agents` skill, split into five group-keyed files:

- `skills/available-agents/registries/language-developers.md` (CC) and `opencode/skills/available-agents/registries/language-developers.md` (OC)
- `skills/available-agents/registries/language-reviewers.md`
- `skills/available-agents/registries/framework-developers.md`
- `skills/available-agents/registries/cicd-developers.md`
- `skills/available-agents/registries/core-specialists.md`

Pick the file matching the new agent's role:
- A new language family (`<lang>-developer`, `<lang>-reviewer`) → `language-developers.md` and `language-reviewers.md` respectively.
- A new framework specialist that layers on top of a language developer (e.g. `react-developer` on `typescript-developer`) → `framework-developers.md`.
- A new CI/CD pipeline tool → `cicd-developers.md`.
- Anything else cross-stack (architect, planner, reviewers that aren't language-specific, MCP, performance, etc.) → `core-specialists.md`.

## Update checklist

When adding (or renaming, or removing) an agent:

1. **CC registry** — add the row to `skills/available-agents/registries/<group>.md`. Match the existing 3-column shape (`Agent | Purpose | When to invoke`).
2. **OC registry** — if the agent has an OpenCode mirror (`opencode/agents/<name>.md` exists), add the row to the corresponding `opencode/skills/available-agents/registries/<group>.md`. Skip this step for CC-only agents (the OC registry must remain self-contained per `.claude/CLAUDE.md`'s "OpenCode configs are standalone" rule).
3. **Code review rule** — if the new agent is a reviewer, add a row to the Agent Usage table in `rules/code-review.md` (CC) and the equivalent section in `opencode/AGENTS.md` (OC).
4. **Sync-configs manifest** — for any new OC file (the agent itself, plus any new registry file or registry row movement that adds/renames a tracked path), update `opencode/.opencode/sync-configs-manifest.md` per `.claude/rules/sync-configs-manifest.md`. One version bump per PR.
5. **Agent README** — add a row to `opencode/agents/README.markdown` per `opencode/.claude/CLAUDE.md`'s README convention.

## Verify before committing

- Confirm the new agent name appears in the matching registry file on every side it exists.
- Confirm CC ↔ OC body parity for the agent file itself (per `agent-prompt-body.md`).
- Confirm `opencode/agents/<name>.md` exists for any agent referenced in OC registries.

## Related rules

- `.claude/rules/frontmatter-description.md` — what to put in the `description` field.
- `.claude/rules/agent-prompt-body.md` — conventions for the prompt body (role frame, task context, worked examples, CC/OC parity).
- `.claude/rules/sync-configs-manifest.md` — manifest update rules for OC.

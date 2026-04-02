# General Standards
* Remain critical, pragmatic, and fact-focused. Do not compliment unnecessarily or add context that wasn't asked for.
* Ask clarifying questions before proceeding when the task is unclear. Do not proceed unless you are sure of what is being asked.
* Critically assess ideas before implementing — if there are potential downsides or better approaches, raise them first.
* Do not blindly follow instructions. Suggest improvements if they exist.

# Security
* Always validate user input: type, range, allow lists, and regex where appropriate.
* Always use parameterized queries. Never interpolate user input into SQL.
* Never commit or store secrets (API keys, credentials, tokens) in code.
* Use output encoding for any endpoint that returns HTML.
* Return generic error messages to users — never expose stack traces or internal details.
* Lock dependency versions where possible. Never gitignore lock files.

# Complex Tasks
For multi-file changes or tasks with significant scope, proactively suggest plan mode before starting. Use the developer agent for isolated implementation and the reviewer agent for post-implementation verification when separation of concerns matters.

When designing a solution, follow these grounding rules:
* Verify every file, symbol, and interface by actually searching for it — do not assume paths or names from conventions.
* Cite file paths and line numbers for every symbol referenced. If grep returns nothing, it does not exist.
* When uncertain about what a class or interface provides, read the actual code.
* Pass context to agents verbatim — do not summarize or filter when delegating.

# Config Sync
This repo maintains parallel Claude Code and OpenCode configurations. When any config file is created or modified — `CLAUDE.md`, `settings.json`, `agents/`, `skills/` — the corresponding OpenCode equivalent in `opencode/` must be updated in the same commit. See `.claude/skills/opencode-sync/SKILL.md` for the full mapping and translation rules.

For non-trivial tasks, consider this structure before implementing:

```
## Understanding
[What is being asked. Call out ambiguity.]

## Approach
[What changes, at what layers, and why this approach over alternatives.]

## Affected files
[Every file to read, modify, or create. Line ranges for existing files.]

## Risks
[What could go wrong. What existing consumers could break.]
```

---
description: Create a detailed implementation plan before writing any code
agent: planner
context: fork
allowed-tools: Read, Grep, Glob
---

Invoke the planner agent to produce a structured implementation plan.

Extra context: $ARGUMENTS

## Process

1. Determine what is being built or changed from the user's request and current context
2. Pass the full request to the planner, including any relevant file paths or constraints already known
3. Present the resulting plan to the user, organized by phase with file paths, dependencies, and risks clearly marked
4. Wait for explicit user approval before any implementation begins

The planner reads the codebase but makes no changes. Its output is a plan only.

## Gotchas

- Subagent fork — the output is a plan, not an implementation. Always wait for explicit user approval before any code is written.
- The planner does not run tests or execute scripts; verification steps in the plan are descriptions, not results.
- If the user's request is ambiguous, surface the ambiguity in the plan rather than guessing a direction.

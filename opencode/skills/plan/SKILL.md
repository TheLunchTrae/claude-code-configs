---
name: plan
description: Create a detailed implementation plan before writing any code
---

<!-- This skill is intended for subagent invocation. When invoking it programmatically, run it as a subtask for context isolation. -->

# Plan: $ARGUMENTS

Produce a structured implementation plan. Use when the task needs phases, file paths, dependencies, and risks laid out before any code is written. Read-only — produces a plan document, no edits.

## Process

1. Determine what is being built or changed from the user's request and current context
2. Restate the requirements clearly, including any relevant file paths or constraints
3. Present the resulting plan organized by phase with file paths, dependencies, and risks clearly marked
4. Wait for explicit user approval before any implementation begins

Read the codebase but make no changes. Output a plan only.

## Gotchas

- Subagent fork — the output is a plan, not an implementation. Always wait for explicit user approval before any code is written.
- The planner does not run tests or execute scripts; verification steps in the plan are descriptions, not results.
- If the user's request is ambiguous, surface the ambiguity in the plan rather than guessing a direction.

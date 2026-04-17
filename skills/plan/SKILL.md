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

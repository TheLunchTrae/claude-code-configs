---
description: Orchestrate multiple agents for complex tasks
agent: planner
subtask: true
---

Break the task into subtasks and assign each to the most suitable agent.

Available agents: planner, architect, code-reviewer, security-reviewer,
build-error-resolver, e2e-runner, doc-updater, refactor-cleaner, go-reviewer.

Execution patterns:
- Sequential: when later work depends on earlier results
- Parallel: for independent tasks that can run concurrently
- Fan-out/fan-in: when multiple perspectives improve the outcome

Principles: plan before executing; minimize context handoffs; parallelize where possible;
maintain clear boundaries with single ownership per artifact.

Simple tasks should use a single agent directly. Reserve orchestration for genuinely
complex, multi-domain work.

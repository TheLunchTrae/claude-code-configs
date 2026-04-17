---
description: Produce a detailed phased implementation plan for the current task, with file paths, risks, and dependencies — no code written. Waits for confirmation before implementation begins.
agent: planner
subtask: true
---

Create a detailed implementation plan before writing any code.

Restate the requirements clearly, identify risks and dependencies, then produce a phased plan
with explicit file paths and step-by-step actions. Do not write any code — output the plan only.
Wait for user confirmation before implementation begins.

If the plan captures non-obvious architectural tradeoffs or a multi-phase approach that future sessions may need to resume, ask the user once — after the plan is presented, before implementation — whether to persist it via `/design <topic-slug>`. Do not persist automatically; only on explicit confirmation.

$ARGUMENTS

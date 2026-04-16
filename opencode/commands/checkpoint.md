---
description: Save verification state and progress checkpoint
agent: lead
subtask: true
---

Save the current verification state and create a progress snapshot.

Capture: test results (total / passing / failing / coverage %), build status, git diff
summary since last checkpoint, completed tasks, blocking issues, and next steps.

Create checkpoints at natural breakpoints: after each phase, before major refactoring,
after fixing critical bugs.

Workflow: plan → implement → checkpoint → verify → checkpoint → implement → repeat.

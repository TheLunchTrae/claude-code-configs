---
description: Enforce TDD workflow with 80%+ coverage
agent: tdd-guide
subtask: true
---

Enforce a strict RED → GREEN → REFACTOR → REPEAT cycle.

Write failing tests first — never skip the RED phase. Implement only the minimal code needed
to pass them, then refactor while keeping tests green.

Coverage targets: 80% minimum for standard code; 100% for financial logic, authentication,
and security-critical paths.

Scaffold: define interfaces/signatures → write tests (happy path, edge cases, error scenarios)
→ implement → verify coverage thresholds are met.

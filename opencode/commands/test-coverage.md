---
description: Analyze and improve test coverage
agent: tdd-guide
subtask: true
---

Run a coverage report, identify gaps, and generate missing tests.

Coverage targets by code type: 80% standard, 90% utilities, 70% UI components, 100%
financial logic and security/auth systems.

Process: run coverage tool → identify low-coverage files ranked by criticality →
list specific uncovered lines → generate missing test cases with expected behavior
and edge cases → produce a prioritized improvement plan (Critical / High / Medium).

Coverage is a metric, not a goal. Focus on meaningful tests, not just hitting numbers.

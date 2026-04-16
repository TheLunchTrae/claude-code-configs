---
description: Run verification loop to validate implementation
agent: lead
subtask: true
---

Run the full verification loop before every commit and PR.

Execute in sequence: type checking, linting, unit tests, integration tests, build. Then verify
test coverage meets the 80% threshold.

Quality checklist:
- No type errors; no lint warnings
- All tests passing; edge cases covered; coverage ≥ 80%
- No hardcoded secrets; input validation present; no SQL injection or XSS risks
- Build succeeds cleanly; no warnings

Report a summary table with PASS/FAIL per check and an action items list for any failures.

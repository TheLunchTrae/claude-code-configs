---
description: Run Go TDD workflow with table-driven tests
agent: tdd-guide
subtask: true
---

Enforce TDD for Go code using table-driven tests and the standard `testing` package.

Follow RED → GREEN → REFACTOR. Write failing tests first using `t.Run` subtests and
table-driven patterns. Implement minimal code to pass, then refactor.

Test categories: unit tests for isolated functions, integration tests for external
dependencies (use build tags or test helpers), benchmark tests for performance-critical code.

Run: `go test ./...` for all tests; `go test -race ./...` for race detection;
`go test -cover ./...` for coverage. Target ≥ 80% coverage; 100% for auth and
security-critical paths.

Use `testify` if already present; prefer stdlib `testing` otherwise.

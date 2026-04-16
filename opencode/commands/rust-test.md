---
description: Rust TDD workflow with unit and property tests
agent: tdd-guide
subtask: true
disable: true
---

Enforce TDD for Rust using unit tests, integration tests, and property-based tests.

Follow RED → GREEN → REFACTOR. Write failing tests first using `#[test]` and
`#[cfg(test)]` modules. Implement minimal code to pass, then refactor.

Test categories: unit tests in-module with `#[cfg(test)]`; integration tests in `tests/`;
property-based tests with `proptest` or `quickcheck` for complex invariants;
doc tests for public API examples.

Run: `cargo test` for all tests; `cargo test -- --nocapture` for output; `cargo tarpaulin`
or `cargo llvm-cov` for coverage. Target ≥ 80% coverage; 100% for auth and
security-critical paths.

Use `mockall` for mocking traits; prefer `Result`-returning tests to avoid panics.

---
description: Fix Rust build, clippy, and dependency errors
agent: build-error-resolver
subtask: true
---

Resolve Rust compilation errors with minimal, surgical changes.

Run `cargo check` to identify compilation failures, then `cargo clippy -- -D warnings`
for code quality issues. Fix errors in order: compilation first, then clippy warnings,
then formatting.

Common categories:
- Borrowing conflicts: restructure so mutable and immutable borrows don't overlap; clone only when necessary
- Type mismatches: use `.into()` or explicit casting
- Import resolution: fix `use` statements; ensure crates are declared in Cargo.toml
- Lifetime issues: use owned types or add explicit lifetime annotations
- Missing trait impls: use derive macros or implement manually

Fix errors only — no refactoring, no improvements. Get the build green with minimal
changes, then re-verify with `cargo build && cargo test`.

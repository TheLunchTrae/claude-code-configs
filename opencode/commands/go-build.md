---
description: Fix Go build, vet, and compilation errors
agent: build-error-resolver
subtask: true
---

Resolve Go build and compilation errors with minimal, surgical changes.

Run `go build ./...` and `go vet ./...` to surface all issues. Fix errors in order:
imports first, then type definitions, function signatures, and static analysis warnings.

Common categories: unused imports, type mismatches requiring conversion, undefined
identifiers needing definition or import, printf-style format directive issues.

Additional commands: `go mod tidy` for dependency issues; `GOOS=linux go build` for
cross-platform builds; `go build -race` for race detection.

Fix errors only — no refactoring, no improvements. Get the build green with minimal
changes, then re-verify with a clean build.

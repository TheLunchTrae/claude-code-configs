---
description: "Run formatter, lint, and type checks on a file or directory"
---

Run the quality pipeline on demand.

## Usage

`/quality-gate [path|.] [--fix] [--strict]`

- Default target: current directory (`.`)
- `--fix` — apply auto-format/fix where the tooling supports it
- `--strict` — treat warnings as failures

## Pipeline

1. Detect the language and tooling for the target path
2. Run formatter checks (prettier, black, gofmt, rustfmt — whichever applies)
3. Run lint and type checks (eslint, tsc, mypy, clippy — whichever applies)
4. Report a concise list of issues with file paths and line numbers
5. If `--fix` was passed, apply safe auto-fixes and report what changed

## Arguments

$ARGUMENTS

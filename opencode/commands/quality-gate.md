---
description: Run quality gate pipeline on specified path
---

Run the quality pipeline on demand: `/quality-gate [path|.] [--fix] [--strict]`

Default target is the current directory. `--fix` applies auto-format/fixes where configured.
`--strict` treats warnings as errors.

Pipeline:
1. Detect language and tooling for the target path.
2. Run formatter checks.
3. Run lint and type checks where available.
4. Produce a concise remediation list.

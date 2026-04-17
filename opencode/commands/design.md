---
description: "Capture or update an architectural design record for this project"
---

Write or update a design record for the given topic so the architectural rationale survives beyond this session.

1. Parse the topic slug from `$ARGUMENTS`. If empty, ask the user for a kebab-case topic slug (e.g. `auth-flow`) before proceeding.

2. Call `design_list` to see whether a design for this topic already exists. If it does, call `design_read({ topic: "<slug>" })` first — you must preserve the existing "Decision log" entries when updating (see `instructions/designs.md`).

3. Compose the updated design following the template in `instructions/designs.md`. On update, APPEND a new entry to the "Decision log" describing what changed and why. Never truncate or overwrite prior log entries. Update "Context", "Decision", "Alternatives considered", and "Consequences" to reflect the current state.

4. Save via `design_write({ topic: "<slug>", content: <full markdown> })`. The plugin handles project resolution, directory creation, and topic validation. The file lands at `~/.opencode-artifacts/<project>/designs/<slug>.md`.

5. Confirm to the user: report the topic, the path returned by the tool, and a one-line summary of what the design now records.

**Fallback:** If `design_write` is unavailable (the `designs` plugin failed to load), fall back to shell:
- Resolve `<project>` via `git remote get-url origin` → strip `.git` and take the last path segment, else `basename $(git rev-parse --show-toplevel)`, else `basename $PWD`.
- Normalize the topic to kebab-case ASCII and validate it against `^[a-z0-9][a-z0-9-]*$`. Reject anything that would escape the directory.
- `mkdir -p ~/.opencode-artifacts/<project>/designs` and write the content to `~/.opencode-artifacts/<project>/designs/<slug>.md`.

$ARGUMENTS

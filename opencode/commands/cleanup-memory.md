---
description: "Delete saved memory entries (rules and facts)"
---

Delete memory entries via the `memory` plugin. Use this for explicit, scoped removal when you already know what to drop. For guided pruning of the full corpus, see `/review-memory`.

Interpret `$ARGUMENTS` as a set of independent, combinable tokens. Absent tokens default to "no restriction":

- `global` — restrict to global-scope memory.
- `project` — restrict to current-project memory.
- `<other-project-name>` — restrict to a specific project's memory.
- `rules` — restrict to rules.
- `facts` — restrict to facts.
- `domain:<x>` — facts only; restrict to entries whose domain matches `<x>`.
- A kebab-case slug (e.g. `commit-style`) — restrict to that specific entry.
- No arguments — wipe every rule and fact across every scope.

Steps:

1. Resolve `$ARGUMENTS` into `memory_list` arguments (`scope`, `kind`, `domain`, `slug`, `project`) and call `memory_list` to enumerate the entries that match. If nothing matches, tell the user there is nothing to clean up and stop.

2. Display the matching entries. Ask for confirmation before proceeding.

3. Upon confirmation, call `memory_delete` with `confirm: true` and the same scope/kind/domain/slug/project arguments. Report the tool's summary back to the user.

If `memory_list` or `memory_delete` is unavailable, stop and tell the user that the `memory` plugin appears unloaded — they should check their OpenCode plugin configuration. Do not fall back to direct file IO.

$ARGUMENTS

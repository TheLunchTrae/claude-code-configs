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

**Fallback:** If the `memory` plugin failed to load and `memory_list` / `memory_delete` are unavailable, read `rules.txt` and `facts.txt` directly under `~/.opencode-data/memory/<project>/` (and `~/.opencode-data/memory/_global/` for the global scope). On-disk format is `slug|trigger|note` for rules and `slug|domain|note` for facts; filter lines manually with `grep -v` and rewrite the file, or `rm` the whole file when wiping a kind. The artifact subtree at `~/.opencode-data/artifacts/` is unrelated and must not be touched.

$ARGUMENTS

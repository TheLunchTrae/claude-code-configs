---
description: "Walk every memory entry and help prune stale, redundant, or contradictory ones"
---

Review the full memory corpus across project and global scopes and help the user prune it. This is the judgment-led counterpart to `/cleanup-memory` — use it when you don't already know what to remove and want guided suggestions.

Steps:

1. Call `memory_list { kind: "all", scope: "all" }` to dump every rule and fact across both project and global scopes.

2. Read every entry and categorize each as one of:
   - **Keep** — current, distinct, adds clear value.
   - **Stale** — references practices, tools, or repos no longer relevant.
   - **Redundant** — another entry already covers the same ground.
   - **Contradictory** — conflicts with another entry; one must go.
   - **Trivial** — too generic or obvious to be worth a memory slot.

3. Skip the Keep entries silently. For each non-Keep entry, present it to the user with:
   - The slug, scope, and full text.
   - A one-line rationale for the categorization.
   - A suggested action: delete, keep, or merge into another named entry.

   Group decisions where possible (e.g. a batch of clearly-redundant entries can share one prompt) to avoid prompting fatigue. Ask the user to confirm or override each suggestion.

4. Apply accepted decisions:
   - **Delete** — call `memory_delete` with `confirm: true`, `slug: <slug>`, and the entry's `scope`.
   - **Merge** — call `memory_write` with the merged content under one of the slugs, then `memory_delete` the obsolete one.
   - **Keep** — no action.

5. End with a one-line summary: number reviewed, kept, deleted, merged.

**Fallback:** If the `memory` plugin failed to load, read `~/.opencode-data/memory/<project>/{rules,facts}.txt` and `~/.opencode-data/memory/_global/{rules,facts}.txt` directly. On-disk format is `slug|trigger|note` for rules and `slug|domain|note` for facts.

$ARGUMENTS

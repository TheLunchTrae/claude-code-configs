---
description: "Walk every memory entry and help prune stale, redundant, or contradictory ones"
---

Review the full memory corpus across project and global scopes and help the user prune it. This is the judgment-led counterpart to `/cleanup-memory` — use it when you don't already know what to remove and want guided suggestions.

Steps:

1. Dump the full corpus via `memory_list` — request every rule and fact across both project and global scopes (its description explains how to express that).

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
   - **Delete** — remove the entry via `memory_delete` (the tool's description documents its confirmation gate and slug/scope filters).
   - **Merge** — write the merged entry via `memory_write`, then delete the obsolete one via `memory_delete`.
   - **Keep** — no action.

5. End with a one-line summary: number reviewed, kept, deleted, merged.

If `memory_list`, `memory_write`, or `memory_delete` is unavailable, stop and tell the user that the `memory` plugin appears unloaded — they should check their OpenCode plugin configuration. Do not fall back to direct file IO.

$ARGUMENTS

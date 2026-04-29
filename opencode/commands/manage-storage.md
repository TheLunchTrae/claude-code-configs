---
description: "Manage stored artifacts and memory: rename a project's storage, review for stale entries, copy across projects, promote project memory to global or demote global to project"
---

Multi-verb management for the `artifacts` and `memory` plugins. Use this for multi-step or interactive workflows that span both subsystems. For one-shot wipes, prefer `/cleanup-artifacts` or `/cleanup-memory`.

Interpret `$ARGUMENTS` as `<verb> [args...]`. Verbs: `rename`, `review`, `copy`, `promote`, `demote`. Empty input or an unrecognised verb prints the usage table below and stops.

## Usage

| Verb | Form |
|------|------|
| `rename` | `/manage-storage rename <old-project> <new-project> [artifacts\|memory\|all]` |
| `review` | `/manage-storage review [project\|global\|all] [artifacts\|memory\|all]` |
| `copy` | `/manage-storage copy <source-project> <dest-project> [artifacts\|memory\|all]` |
| `promote` | `/manage-storage promote <slug> [rule\|fact]` |
| `demote` | `/manage-storage demote <slug> [rule\|fact]` |

Domain tokens (`artifacts` / `memory` / `all`) on `rename` and `copy` default to `all`. Scope and kind tokens on `review` default to `all`. `promote` and `demote` are memory-only — artifacts have no scope axis.

## rename

Move every project-scoped artifact and memory entry from `<old>` to `<new>`. Globals are unaffected (they have no project axis).

1. Validate that both project names match `^[a-z0-9][a-z0-9-]*$`, are distinct, and that the optional domain token is one of `artifacts` / `memory` / `all` (default `all`). On failure, print the usage row above and stop.
2. **Refuse on destination collision.** Before enumerating the source, list the destination:
   - When domain ∈ {artifacts, all}: `artifact_list(project: <new>)`. If the result is non-empty, stop and tell the user the destination already has artifacts; suggest `/cleanup-artifacts <new>` first or use `copy` if a merge is intended.
   - When domain ∈ {memory, all}: `memory_list(kind: "all", scope: "project", project: <new>)`. If non-empty, stop with the same shape of message.
3. **Enumerate the source.** When domain ∈ {artifacts, all}: `artifact_list(project: <old>)`. When domain ∈ {memory, all}: `memory_list(kind: "all", scope: "project", project: <old>)`. If the combined result is empty, tell the user there is nothing to rename and stop.
4. **Confirm.** Show counts (`Will move N artifacts and M memory entries from <old> → <new>. Continue?`) and wait for the user.
5. **Apply.** For each artifact: `artifact_read(command, project: <old>)` → `artifact_write(command, content, project: <new>)`. For each memory entry: `memory_write(kind, slug, note, trigger?, domain?, scope: "project", project: <new>)`. If any single write returns a `<tool> failed: ...` string, **stop immediately and do not proceed to step 6**. Report what was copied so the user can resolve before re-running.
6. **Delete the source** only after every write in step 5 succeeded. When domain ∈ {artifacts, all}: `artifact_delete(confirm: true, project: <old>)`. When domain ∈ {memory, all}: `memory_delete(confirm: true, scope: "project", project: <old>)`.
7. **Report.** `Renamed <old> → <new>: N artifacts, M rules, K facts moved.`

## review

Walk artifacts and memory across the requested scope and kind, applying model judgment to flag entries the user may want to drop. Supersedes the older `/review-memory`.

1. Validate the scope token (`project` / `global` / `all`, default `all`) and the kind token (`artifacts` / `memory` / `all`, default `all`). On failure, print the usage row above and stop. The `global` scope skips artifacts (artifacts have no scope axis).
2. **Memory phase** — unless kind is `artifacts`. Dump entries via `memory_list(kind: "all", scope: <scope>)`. Categorize each as one of:
   - **Keep** — current, distinct, adds clear value.
   - **Stale** — references practices, tools, or repos no longer relevant.
   - **Redundant** — another entry already covers the same ground.
   - **Contradictory** — conflicts with another entry; one must go.
   - **Trivial** — too generic or obvious to be worth a memory slot.
3. **Artifact phase** — unless kind is `memory` or scope is `global`. Dump artifacts via `artifact_list()`; for each, `artifact_read(command, project)` and categorize:
   - **Keep** — current, useful handoff for resuming.
   - **Stale** — content references in-flight work that is clearly already done (judgment from content alone).
   - **Orphaned** — the artifact's project directory no longer exists on disk (best-effort `ls` check on the project path; when uncertain, ask).
   - **Trivial** — empty or placeholder.
4. **Skip Keep entries silently.** For each non-Keep entry from either phase, present:
   - The slug + scope (memory) or project + command (artifacts).
   - The full text.
   - A one-line rationale for the categorization.
   - A suggested action: delete, keep, or merge into another named entry (memory only).

   Group decisions where possible (e.g. a batch of clearly-redundant memory entries can share one prompt) to avoid prompting fatigue. Ask the user to confirm or override each suggestion.
5. **Apply accepted decisions:**
   - Memory **delete** — `memory_delete(confirm: true, slug, kind, scope)`.
   - Memory **merge** — `memory_write` for the merged entry, then `memory_delete` on the obsolete one.
   - Artifact **delete** — `artifact_delete(confirm: true, command, project)`.
   - **Keep** — no action.
6. **Report.** Single combined line: `Reviewed N memory entries (kept K, deleted D, merged M); P artifacts (kept K, deleted D).` Omit the half that was skipped via the kind token.

## copy

Copy entries from `<source>` to `<dest>` while leaving `<source>` untouched.

1. Validate that both project names match `^[a-z0-9][a-z0-9-]*$`, are distinct, and that the optional domain token is one of `artifacts` / `memory` / `all` (default `all`). On failure, print the usage row and stop.
2. **Enumerate the source** (same calls as step 3 of `rename`). If empty, tell the user there is nothing to copy and stop.
3. **Pre-check the destination** for collisions:
   - Artifacts: a destination artifact with the same `command` name as a source entry.
   - Memory: a destination entry with the same `slug` at project scope, **either same kind as the source entry (overwrite would clobber) or different kind (the `memory_write` contract rejects this and emits a "delete first" hint)**.

   For each colliding entry, **skip it with a warning** rather than overwriting. Hint that the user can `/cleanup-artifacts <dest>` / `/cleanup-memory <dest>` first or use `rename` if a clean copy is what they want.
4. **Confirm.** Show counts of planned writes and skipped collisions. Wait for the user.
5. **Apply.** For each non-skipped artifact: `artifact_read(command, project: <source>)` → `artifact_write(command, content, project: <dest>)`. For each non-skipped memory entry: `memory_write(kind, slug, note, trigger?, domain?, scope: "project", project: <dest>)`. The source is never touched.
6. **Report.** `Copied <source> → <dest>: N artifacts, M rules, K facts (skipped S collisions).`

## promote / demote

Move a memory entry between scopes. `promote` goes project → global; `demote` goes global → project. Both verbs share the procedure below; only the source and destination scopes flip.

1. Validate that `<slug>` matches `^[a-z0-9][a-z0-9-]{0,63}$` and that the optional kind token is one of `rule` / `fact`. On failure, print the usage row and stop.
2. **Locate the source.** Source scope is `project` for `promote`, `global` for `demote`. Run `memory_list(slug: <slug>, kind: <kind-token> ?? "all", scope: <source-scope>)`.
   - Zero matches → stop with `slug "<slug>" not found in <source-scope> scope.`
   - Multiple matches across kinds with no explicit kind token → stop with `slug "<slug>" exists as both rule and fact in <source-scope> scope; pass kind explicitly (rule or fact).`
3. **Pre-check the destination** at the opposite scope via `memory_list(slug: <slug>, kind: "all", scope: <dest-scope>)`:
   - **Same-kind same-slug** → ask the user whether to overwrite or abort.
   - **Cross-kind same-slug** → stop and surface the `memory_write` "delete first" hint verbatim. Cross-kind same-slug entries cannot coexist in a single scope; the user must delete the colliding entry first.
4. **Confirm.** `<Verb> <kind> "<slug>" <source> → <dest>. Continue?` Wait for the user.
5. **Apply, in order:** `memory_write(kind, slug, note, trigger?, domain?, scope: <dest-scope>)` first, then `memory_delete(confirm: true, slug, kind, scope: <source-scope>)`. Write-first ordering is intentional — if the delete fails, the result is a recoverable duplicate (project shadows global per the storage convention), not data loss. If the source scope is `global`, the `memory_delete` call must omit `project`; the tool rejects `project` when `scope: "global"`.
6. **Report.** `Promoted <kind> "<slug>" project → global.` (or symmetric for demote).

## Plugin availability

If `artifact_read`, `artifact_write`, `artifact_list`, or `artifact_delete` is unavailable, stop and tell the user the `artifacts` plugin appears unloaded — they should check their OpenCode plugin configuration. Same for `memory_list`, `memory_write`, `memory_delete` and the `memory` plugin. Do not fall back to direct file IO.

$ARGUMENTS

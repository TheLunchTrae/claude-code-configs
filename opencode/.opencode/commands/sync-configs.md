---
description: "Sync OpenCode config files (agents, commands, skills, plugins) from the upstream GitHub repo. Use to pull config updates after a version bump."
---

**Execute this procedure now as tool calls.** This command is a runtime sync operation — not a specification to implement. Do not author code, plugins, or scripts that reproduce the procedure.

Sync OpenCode config files from the upstream GitHub repo into the local configs directory. The `sync-configs` plugin provides four small helpers (`sync_configs_get_manifest`, `sync_configs_fetch_file`, `sync_configs_classify`, `sync_configs_record_version`); orchestrate them using your built-in `Task`, `Write`, and `Bash` tools.

## Procedure

1. **Get the manifest.** Call `sync_configs_get_manifest` with no arguments. Returns `{version, paths, deleted, last_local_version, short_circuit}`.
   - If `error` is set, print it verbatim and exit. Do not proceed.
   - If `short_circuit` is `true`, print `Already up to date (version <version>).` and exit.

2. **Determine the configs root.** This is the directory under which manifest-relative paths resolve when you `Write` or pass `local_path` to `sync_configs_classify`. Default: the current working directory. Override: any project-level `AGENTS.md` instructions take precedence — if `AGENTS.md` says "sync into `<subdir>/`", treat `<subdir>/` as the configs root. The plugin tools never see this root; you bake it into every Write you do and every `local_path` arg you pass.

3. **Sync paths via parallel subagent batches.** Compute the full sync list with `Object.values(manifest.paths).flat()`. Split it into batches of ~8-10 paths each. **Dispatch one subagent per batch via the `Task` tool, running all batches in parallel.** Each subagent has access to `sync_configs_fetch_file`, `sync_configs_classify`, and `Write`. Pass each subagent the configs root and its assigned batch of paths.

   **Each subagent's per-path procedure (no human interaction):**
   1. Call `sync_configs_fetch_file({ path })`. If `ok: false`, record `{path, status: "failed", reason}` and continue.
   2. Call `sync_configs_classify({ path, local_path: "<configs_root>/<path>", remote: <upstream-body> })`. The plugin reads the local file itself; no need to read it first.
   3. Branch on `status`:
      - `unchanged` → record `{path, status: "unchanged"}`.
      - `updated` → `Write` the upstream body to `<configs_root>/<path>`. Record `{path, status: "updated"}`.
      - `needs-user-decision` → **do not act**. Record `{path, status: "needs-user-decision", local_only_lines, reason, remote: <upstream-body>}` and return to the primary. The primary handles user interaction centrally.
   4. After processing every assigned path, return the aggregated batch result to the primary.

   The primary collects every batch's results into running tallies: `updated[]`, `unchanged[]`, `failed[]`, and a list of needs-user-decision entries to handle.

4. **Resolve needs-user-decision entries (primary, sequentially).** For each entry from the batch results:
   - Show the path and the entry's `reason`.
   - Quote the entry's `local_only_lines` verbatim under a heading `Local-only lines (not in upstream — most likely stale from a prior manifest version):`. Verbatim quoting matters — paraphrasing makes stale upstream content read like the user's customisation, which is what causes "preserve" to be chosen by mistake.
   - For `opencode.jsonc` only, additionally note that the `permission` block is the typical preserve target.
   - Ask the user to choose **drop** (default — write the upstream content), **preserve** (keep the local content as-is), **custom** (the user supplies hand-merged content), or **skip** (leave unresolved). Default to recommending **drop** unless the local-only content is unambiguously project-specific (paths, project names, environment values, secrets) that upstream would never carry.
   - Apply the choice:
     - drop → `Write` the entry's `remote` body to `<configs_root>/<path>`, push onto `updated[]`.
     - preserve → leave the local file alone, push onto `preserved[]`.
     - custom → ask the user for the merged content, `Write` it to `<configs_root>/<path>`, push onto `updated[]`.
     - skip → push onto `unresolved[]`.

5. **Apply deletions.** Only if `last_local_version` was defined (first-run safety: never delete on a fresh install). For each path in `manifest.deleted`:
   - Try `Bash rm -- "<configs_root>/<path>"`. If the file did not exist, ignore the error. Otherwise push onto `deleted[]`. On other errors push onto `failed[]`.

   If `last_local_version` was undefined and `manifest.deleted` is non-empty, note this for the report (a "Skipped N deletion(s)" footer).

6. **Persist version (only on full success).** If `failed[]` is empty AND `unresolved[]` is empty, call `sync_configs_record_version({ version: manifest.version })`. If `ok: false`, push the failure into `failed[]` and skip the version persist. If `failed[]` or `unresolved[]` is non-empty, do NOT call `sync_configs_record_version` — leave the local version state alone so the next `/sync-configs` re-enters and retries.

7. **Print the report:**

```
## Sync complete (version <version>)

**Updated** (N):
- path/to/file.md

**Unchanged** (N):
- path/to/file.md

**Preserved** (N):
- path/to/file.md

**Deleted** (N):
- path/to/old-file.md

**Failed** (N):
- path/to/file.md — <reason>

**Unresolved (skipped)** (N):
- path/to/file.md
```

Omit any section whose count is zero. Append footers as applicable:
- If version was NOT persisted (failures or unresolved present): `Version not advanced — re-run /sync-configs to retry the failed/unresolved paths.`
- If `last_local_version` was undefined and deletions were skipped: `Skipped N deletion(s) — no prior sync state, cannot prove these files came from a previous sync.`
- If `.opencode/plugins/sync-configs.ts` is in `updated[]`: `Plugin .opencode/plugins/sync-configs.ts was updated in this run — restart OpenCode to load the new version.`

$ARGUMENTS

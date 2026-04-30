---
description: "Sync OpenCode config files (agents, commands, skills, plugins) from the upstream GitHub repo. Use to pull config updates after a version bump."
---

Sync OpenCode config files from the upstream GitHub repo into the local configs directory. The `sync-configs` plugin provides four small helper tools (`sync_configs_get_manifest`, `sync_configs_fetch_file`, `sync_configs_classify`, `sync_configs_record_version`); this command orchestrates them using your built-in `Read`, `Write`, and `Bash` tools so each tool result stays small. Path resolution is your job — see step 2.

## Procedure

1. **Get the manifest.** Call `sync_configs_get_manifest` with no arguments. Returns `{ version, paths, deleted, last_local_version, short_circuit }`.
   - If `error` is set, print it verbatim and exit. Do not proceed.
   - If `short_circuit` is `true`, print `Already up to date (version <version>).` and exit.

2. **Determine the configs root.** This is the directory under which manifest-relative paths resolve when you call `Read`/`Write`/`Bash`. Default: the current working directory. Override: any project-level `AGENTS.md` instructions take precedence — if `AGENTS.md` says "sync into `<subdir>/`", treat `<subdir>/` as the configs root. The plugin tools never see this path; you bake it into every Read/Write you do.

3. **Walk the manifest.** Initialize running tallies: `updated[]`, `unchanged[]`, `preserved[]`, `deleted[]`, `failed[]`, `unresolved[]`. Compute the full sync list with `Object.values(manifest.paths).flat()`. For each `<path>` in that list, in order:

   a. **Read local.** `Read` `<configs_root>/<path>`. If the file does not exist, capture local-missing.

   b. **Fetch upstream.** Call `sync_configs_fetch_file({ path: "<path>" })`. If `ok: false`, push `{ path, reason }` onto `failed[]` and continue to the next path.

   c. **Classify and act:**
      - If local was missing → status is implicitly `updated`. `Write` the upstream body to `<configs_root>/<path>` (creating parent dirs as needed via Bash `mkdir -p` if Write doesn't auto-create). Push the path onto `updated[]`.
      - Otherwise call `sync_configs_classify({ path: "<path>", local: <local-body>, remote: <upstream-body> })`. Returns `{ status }` plus drift metadata if applicable. Branch on status:
        - `unchanged` → push onto `unchanged[]`.
        - `updated` → `Write` the upstream body to `<configs_root>/<path>`. Push onto `updated[]`.
        - `needs-user-decision` → surface to the user (procedure in step 4) and act on their choice.

4. **Surfacing needs-user-decision cases.** When `classify` returns `needs-user-decision`:
   - Show the path and the entry's `reason`.
   - Quote the entry's `local_only_lines` verbatim under a heading `Local-only lines (not in upstream — most likely stale from a prior manifest version):`. Verbatim quoting matters — paraphrasing makes stale upstream content read like the user's customisation, which is what causes "preserve" to be chosen by mistake.
   - For `opencode.jsonc` only, additionally note that the `permission` block is the typical preserve target.
   - Ask the user to choose **drop** (default — write the upstream content), **preserve** (keep the local content as-is), **custom** (the user supplies hand-merged content), or **skip** (leave unresolved). Default to recommending **drop** unless the local-only content is unambiguously project-specific (paths, project names, environment values, secrets) that upstream would never carry.
   - Apply the choice:
     - drop → `Write` the upstream body to `<configs_root>/<path>`, push onto `updated[]`.
     - preserve → leave the local file alone, push onto `preserved[]`.
     - custom → ask the user for the merged content, `Write` it to `<configs_root>/<path>`, push onto `updated[]`.
     - skip → push the path onto `unresolved[]`.

5. **Apply deletions.** Only if `last_local_version` was defined (first-run safety: never delete on a fresh install — the plugin can't prove those files came from a previous sync). For each path in `manifest.deleted`:
   - Try `Bash rm -- "<configs_root>/<path>"`. If the file did not exist, ignore the error. Otherwise push onto `deleted[]`. On other errors push onto `failed[]`.

   If `last_local_version` was undefined and `manifest.deleted` is non-empty, note this for the report (a "Skipped N deletion(s)" footer).

6. **Persist version (only on full success).** If `failed[]` is empty AND `unresolved[]` is empty, call `sync_configs_record_version({ version: manifest.version })`. If `ok: false`, push the failure into `failed[]` and skip the version persist (the user re-running will retry). If `failed[]` or `unresolved[]` is non-empty, do NOT call `sync_configs_record_version` — leave the local version state alone so the next `/sync-configs` re-enters and retries.

7. **Print the report.** Use this template:

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

## Notes

- This command requires the `sync-configs` plugin to be loaded from `.opencode/plugins/sync-configs.ts` (project-local plugin, auto-discovered when OpenCode loads the project's `.opencode/` config dir). First-time setup is documented at the OpenCode config root `README.md` ("First-time setup") — a single shell snippet that curls the plugin file into place.
- Path resolution is the agent's job. The plugin tools take only manifest-relative paths and do not touch the user's filesystem (except for the version state file under `~/.opencode-data/sync-configs/`). This means the plugin works correctly whether OpenCode runs at the configs dir or one level above it — your `Read`/`Write` calls put the configs in the right place per the user's `AGENTS.md`.
- The version is stored per project at `~/.opencode-data/sync-configs/<project>/version`, where `<project>` is `basename(PluginInput.project.worktree)` resolved by OpenCode (the OpenCode worktree, not the configs subdir).
- Removing the version file forces the next run to re-sync every tracked file from scratch, but entries in the manifest's `deleted` array will be **skipped** on that run — the plugin cannot prove those files came from a previous sync. Deletions from the current manifest version will not be applied retroactively unless the upstream manifest bumps the version again.

$ARGUMENTS

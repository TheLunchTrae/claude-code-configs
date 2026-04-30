---
description: "Sync OpenCode config files (agents, commands, skills, plugins) from the upstream GitHub repo. Use to pull config updates after a version bump."
---

Sync OpenCode config files from the upstream GitHub repo into this project directory. The mechanical work (manifest fetch, version compare, parallel path fetch, classification, atomic version persist) lives in the `sync-configs` plugin. This command is the user-facing wrapper.

## Procedure

1. **Plan.** Call the `sync_configs_plan` tool with no arguments. It returns a JSON object: `{ short_circuit?, manifest_version, last_version, paths: [...], delete_paths: [...], delete_skipped_first_run? }`.
   - If `error` is set, print it verbatim and exit. Do not call apply.
   - If `short_circuit` is set, print `Already up to date (version <manifest_version>).` and exit.

2. **Surface needs-user-decision cases.** For each entry in `paths` with `status: "needs-user-decision"`:
   - Show the path and the entry's `reason`.
   - Quote `local_only_lines` verbatim under a heading `Local-only lines (not in upstream — most likely stale from a prior manifest version):`. Verbatim quoting matters — paraphrasing makes stale upstream content read like the user's customisation, which is what causes "preserve" to be chosen by mistake.
   - For `opencode.jsonc` only, additionally note that the `permission` block is the typical preserve target.
   - Ask the user to choose **drop** (default — write the upstream content), **preserve** (keep the local content as-is), or **custom** (the user supplies hand-merged content). Default to recommending **drop** unless the local-only content is unambiguously project-specific (paths, project names, environment values, secrets) that upstream would never carry.
   - If the user skips a path, treat it as unresolved.

3. **Apply.** Call `sync_configs_apply` with:
   - `manifest_version`: from the plan result. Apply re-fetches the manifest and aborts if upstream has moved.
   - `paths_to_update`: every plan entry with `status: "updated"`, mapped to its `path` (a plain string). Apply re-fetches each from upstream and writes the body — do **not** include any content here; the plan tool intentionally omits bodies for `updated` paths to keep the round-trip small.
   - `decisions`: one entry per resolved needs-user-decision case, shaped per the user's choice:
     - drop → `{ path, action: "drop" }` (apply re-fetches and writes the upstream body)
     - preserve → `{ path, action: "preserve" }` (apply leaves the local file alone)
     - custom → `{ path, action: "custom", content: <user-supplied merged content> }`
   - `unresolved`: paths the user skipped.
   - `delete_paths`: from the plan result.
   - `failed`: every plan entry with `status: "failed"`, mapped to `{ path, reason: <entry.reason> }`.

4. **Print the report** based on the apply result. The `unchanged` count comes from the plan result (paths with `status: "unchanged"`); every other section comes from the apply result. Use this template:

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

Omit any section whose count is zero. When `version_advanced` is `false`, append `Version fact not advanced — re-run /sync-configs to retry the failed/unresolved paths.`. When `delete_skipped_first_run` is set on the plan result, append `Skipped N deletion(s) — no prior sync state, cannot prove these files came from a previous sync.`. When `plugin_self_updated` is `true`, append `Plugin .opencode/plugins/sync-configs.ts was updated in this run — restart OpenCode to load the new version.`

## Notes

- This command requires the `sync-configs` plugin to be loaded from `.opencode/plugins/sync-configs.ts` (project-local plugin, auto-discovered when OpenCode loads the project's `.opencode/` config dir). First-time setup is documented at the OpenCode config root `README.md` ("First-time setup") — a single shell snippet that curls the plugin file into place. OpenCode auto-installs plugin dependencies (`@opencode-ai/plugin`) at startup, so no manual `bun install` is required.
- The version is stored per project at `~/.opencode-data/sync-configs/<project>/version`, where `<project>` is `basename(PluginInput.project.worktree)` resolved by OpenCode. Run `/sync-configs` from the same working directory each time so the same project is resolved on read and write.
- Removing the version file forces the next run to re-sync every tracked file from scratch, but entries in the manifest's `deleted` array will be **skipped** on that run — the plugin cannot prove those files came from a previous sync. Deletions from the current manifest version will not be applied retroactively unless the upstream manifest bumps the version again.

$ARGUMENTS

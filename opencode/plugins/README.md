# Plugins

TypeScript modules auto-discovered by OpenCode at session start. Each plugin can register tools the model calls, subscribe to lifecycle hooks (session start, every chat message, every tool call, etc.), and inject environment variables into shell commands the model runs.

## How OpenCode loads them

1. On session start, OpenCode scans `opencode/plugins/*.ts`.
2. Each module's default export should be an async function matching the `Plugin` type from `@opencode-ai/plugin`.
3. The function receives `{ $, directory, project, client, … }` and returns a `Hooks` object.
4. `tool: { … }` entries on the returned object become tools the model can call (e.g. `memory_write`).
5. Named hooks on the returned object (`"shell.env"`, `"experimental.chat.system.transform"`, `"tool.execute.before"`, …) fire on OpenCode lifecycle events.

## Authoring reference

- OpenCode docs: <https://opencode.ai/docs/plugins/>
- Plugin SDK source (authoritative for type signatures): <https://github.com/anomalyco/opencode/tree/dev/packages/plugin>
  - `src/index.ts` — `PluginInput`, `Plugin`, `Hooks`.
  - `src/tool.ts` — `tool()` helper; `tool.schema` is a re-export of zod.

The `Hooks` interface in `src/index.ts` is the ground truth for which events exist and what their input/output shapes are. Verify against source before adding a new handler — the docs page lags the interface.

## Dependencies

Runtime deps stay minimal. Prefer Node/Bun built-ins; pull in an npm dep only when the value clearly outweighs the install surface. The only current runtime dep is `@opencode-ai/plugin`. `bun install` at `opencode/` sets up local types for editor tooling but those packages don't ship to users.

## Inventory

### `artifacts.ts` — ArtifactsPlugin

Durable session-handoff storage under `~/.opencode-artifacts/<project>/<command>.md`. One file per command per project, overwritten on each run (no history).

- Hook: `shell.env` injects `OPENCODE_PROJECT` and `OPENCODE_ARTIFACT_DIR`.
- Tools: `artifact_read`, `artifact_write`, `artifact_list`, `artifact_delete`.
- Startup TTL prune: deletes artifacts older than `OPENCODE_ARTIFACT_TTL_DAYS` (default 90). Set to `0` to disable.
- Powers the `/handoff`, `/catchup`, and `/cleanup-artifacts` commands.

### `memory.ts` — MemoryPlugin

Durable store for manually-authored **rules** (behavioral directives; auto-injected) and **facts** (tool-gated context). Scoped per-project or globally.

- Hook: `shell.env` injects `OPENCODE_MEMORY_DIR`.
- Hook: `experimental.chat.system.transform` appends a merged `Rules — follow when the "when" fires:` block to every system prompt (globals first, project last). Hard 2000-char cap with truncation footer.
- Tools: `memory_list`, `memory_write`, `memory_delete`.
- Storage: pipe-delimited `slug|trigger|note` (rules) and `slug|domain|note` (facts) at `~/.opencode-artifacts/{<project>,_global}/memory/{rules,facts}.txt`.
- Atomic writes via tmp + rename; no TTL.
- `memory/instincts.txt` is **reserved** for a future observer-derived store (ECC-style) — no current tool reads or writes it.

See the tool descriptions inside `memory.ts` for when-to-write guidance; it surfaces at tool-call time.

### `block-secrets.ts` — BlockSecretsPlugin

Hook `tool.execute.before` blocks reads of sensitive files (`.env`, `.env.*` except common templates, `*.pem`, SSH private keys, `*.key`, `credentials.json`, `.netrc`, `secrets.{json,yaml,yml}`, `*.p12`, `*.pfx`, `.aws/credentials`, anything under `.ssh/`).

Applies to `read`, `glob`, `edit`, `write` (by inspecting path args) and `bash` (by token-scanning the command). Safe-read allowlist in `ALLOWED_BASENAMES` inside the plugin — extend there if a legitimate template trips the block.

### `lib/project.ts` — shared helpers

Not a plugin; imported by `artifacts.ts` and `memory.ts`. Exports:

- `ARTIFACT_ROOT` — `~/.opencode-artifacts`.
- `projectNameFromRemoteUrl(url)` — git remote URL → project name.
- `makeResolveProject({ $, directory })` — factory returning a cached `() => Promise<string>` that resolves the current project via git remote → repo basename → cwd basename.
- `removeEmptyDir(dir)` — no-throw `rmdir` that ignores non-empty errors.
- `deleteFile(path, result)` — no-throw `unlink` that accumulates into a `DeleteResult`.
- `DeleteResult` type — `{ deleted: string[]; skipped: string[] }`.

Edit here, not in copies.

## Adding a new plugin

1. Create the `.ts` file under `plugins/`. Export an async `Plugin` function as the default or a named export OpenCode can pick up.
2. If a new npm runtime dep is needed, add it to `opencode/package.json` and note the reason in the plugin's opening comment.
3. Add the plugin file path to the `## Plugins` section of `opencode/.opencode/sync-configs-manifest.md` so it propagates on `/sync-configs`.
4. Add a bullet to the inventory above.
5. No change to `opencode.jsonc` is needed — plugins are auto-discovered.

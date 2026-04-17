# OpenCode configs — agent notes

# opencode.jsonc — permission notes

The `permission.bash` block is matched top-down with last-matching-pattern semantics, so denies must sit at the bottom to take precedence over broader allows or asks. The canonical order is **`allow` rules → `ask` rules → `deny` rules**, and each group is sorted alphabetically. Keep rules grouped and alphabetised on every edit.

The `permission.edit` is set to `"ask"` globally.

This directory contains OpenCode-specific configuration. It is not a Claude Code config directory — OpenCode reads `AGENTS.md`, `opencode.jsonc`, and files under `agents/`, `commands/`, and `skills/`. This `.claude/CLAUDE.md` file is read only by Claude Code agents working in this repository, not by OpenCode itself.

# Hooks are out of scope

Hooks are intentionally not versioned in this repo on either the Claude Code side or the OpenCode side. The opencode-mirror mapping reflects that — no hook entries exist. Do not add any.

# OpenCode-exclusive commands

Some commands in `opencode/commands/` have no Claude Code equivalent and should never be given one. They exist only in OpenCode because they rely on patterns or conventions (like `~/.opencode-artifacts/`) that belong to OpenCode sessions.

Do not create a matching `skills/<name>/SKILL.md` for any command listed here. Do not add them to the opencode-mirror mapping.

**If you add, rename, or remove an OpenCode-exclusive command, update this file in the same commit.**

## Registry

### /handoff — `opencode/commands/handoff.md`

Saves a structured session summary to `~/.opencode-artifacts/<project>/handoff.md`. Overwrites on each run. Used to preserve context across sessions manually.

OpenCode-exclusive because: writes to `~/.opencode-artifacts/`, a convention that only exists for OpenCode sessions.

### /catchup — `opencode/commands/catchup.md`

Reads `~/.opencode-artifacts/<project>/handoff.md` and orients the agent at the start of a new session.

OpenCode-exclusive because: reads from `~/.opencode-artifacts/`, paired with `/handoff`.

### /design — `opencode/commands/design.md`

Writes or updates an architectural design record at `~/.opencode-artifacts/<project>/designs/<topic>.md`. One file per topic, overwritten on each write; rationale history is preserved in-file via an appended "Decision log" section. Paired with the `designs` plugin's tools and with `instructions/designs.md`, which tells agents when to call `design_list` / `design_read` / `design_write`.

OpenCode-exclusive because: writes to `~/.opencode-artifacts/`, a convention that only exists for OpenCode sessions.

### /cleanup-artifacts — `opencode/commands/cleanup-artifacts.md`

Deletes artifacts under `~/.opencode-artifacts/`. Accepts zero, one, or two positional arguments: a project name removes all artifacts for that project, a command name removes that command's file from every project, both together (`<project> <command>`) deletes a single file, and no arguments deletes everything. Always lists files and asks for confirmation before deleting.

OpenCode-exclusive because: operates on `~/.opencode-artifacts/`, a convention that only exists for OpenCode sessions.

### /sync-configs — `opencode/.opencode/commands/sync-configs.md`

Fetches each file in a manifest from `raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/`, compares to the local copy under `~/.claude/`, and merges changes (prefer remote, preserve clear local-only customizations, ask user when intent is ambiguous or diffs are large). Reports updated, unchanged, and failed files.

OpenCode-exclusive because: it writes directly to `~/.claude/` config files and is designed for syncing the global OpenCode config setup, not for use within individual projects.

# Artifact storage convention

OpenCode commands that write persistent artifacts use:

```
~/.opencode-artifacts/<project>/<command>.md
```

- `<project>` is the git remote repo name, local repo directory name, or working directory name (in that priority order)
- `<command>` matches the command directory name under `opencode/commands/`
- Single file per command per project, overwritten on each run (no append/history)

# Plugins

Authored OpenCode plugins live in `opencode/plugins/`. They are TypeScript modules auto-discovered by OpenCode at session start. `opencode/package.json` + `opencode/tsconfig.json` exist so `bun install` at the config root resolves the plugin SDK (`@opencode-ai/plugin`) and types (`@types/bun`, `typescript`) for editor tooling.

Keep runtime dependencies minimal. Prefer Node/Bun built-ins; pull in an npm runtime dep only if the value clearly outweighs the install surface.

## Plugin SDK reference

When authoring a plugin, the canonical reference for the `Plugin` type, the `Hooks` interface (every available event with its `input` / `output` signature), and the `tool()` helper is the package source:

- Repo: <https://github.com/anomalyco/opencode/tree/dev/packages/plugin>
- `src/index.ts` — `PluginInput`, `Plugin`, `Hooks`, `ToolDefinition` re-exports.
- `src/tool.ts` — `tool()` helper and `tool.schema` (re-export of `zod`).

Verify hook signatures and the return shape against the source before adding a new event handler. The OpenCode docs page is a good orientation but the source is authoritative.

## Registry

### `plugins/artifacts.ts` — ArtifactsPlugin

- **`shell.env` hook** — injects `OPENCODE_ARTIFACT_DIR` and `OPENCODE_PROJECT` so shell commands can reference the resolved artifact path without re-deriving it.
- **Custom tools** — registers `artifact_read`, `artifact_write`, `artifact_list`, and `artifact_delete`. These are the preferred API for `/handoff`, `/catchup`, and `/cleanup-artifacts`. Each tool accepts an optional `project` argument for cross-project access; omitted, it uses the current project resolved via the same git-remote → repo-dir → cwd fallback chain documented under "Artifact storage convention". `artifact_delete` requires `confirm: true` on every call as a guardrail; scope is implied by which of `command` / `project` are passed (both → single file, only `project` → all artifacts in that project, only `command` → that command's file across every project, neither → wipe everything).
- **Startup TTL prune** — on plugin init, fires a fire-and-forget pass that deletes any artifact whose `mtime` is older than `OPENCODE_ARTIFACT_TTL_DAYS` (default `90`). Set the env var to `0` to disable. Errors during the prune do not block plugin init; deletions are logged via `console.log` when any occur.

### `plugins/designs.ts` — DesignsPlugin

- **`shell.env` hook** — injects `OPENCODE_DESIGN_DIR` (the current project's `designs/` directory) alongside the `OPENCODE_PROJECT` / `OPENCODE_ARTIFACT_DIR` already set by the artifacts plugin.
- **Custom tools** — registers `design_read`, `design_write`, `design_list`, and `design_delete`. Designs live at `~/.opencode-artifacts/<project>/designs/<topic>.md` — long-lived architectural memory, one file per topic, overwritten on write. Each tool accepts an optional `project` argument; omitted, it uses the current project resolved via the same git-remote → repo-dir → cwd fallback chain as the artifacts plugin. Topic slugs are validated against `^[a-z0-9][a-z0-9-]{0,63}$` after whitespace/casing normalization. `design_delete` requires `confirm: true` on every call; scope follows the same pattern as `artifact_delete` but is confined to the `designs/` subdirectory (will not touch artifacts).
- **No TTL prune** — designs are durable, not session-scoped. Pruning is manual via `design_delete` or `/cleanup-artifacts`.
- **Update protocol** — agents updating an existing design must `design_read` first and preserve every prior "Decision log" entry verbatim, then append a new entry. The tool description repeats this rule so the constraint is visible even without reading `instructions/designs.md`.

### `plugins/block-secrets.ts` — BlockSecretsPlugin

- **`tool.execute.before` hook** — blocks reads of sensitive files (`.env`, `.env.*` except `*.example/sample/template/defaults/dist`, `*.pem`, SSH private keys, `*.key`, `credentials.json`, `.netrc`, `secrets.{json,yaml,yml}`, `*.p12`, `*.pfx`, `.aws/credentials`, anything under `.ssh/`).
- Applies to `read`, `glob`, `edit`, `write` tool calls (by inspecting their path argument) and to `bash` (by token-scanning the command for blocked paths).
- Safe-read exceptions live in `ALLOWED_BASENAMES` inside the plugin; extend the set if a legitimate template trips the block.

## When adding a new plugin

1. Create the TS file under `opencode/plugins/`.
2. If it needs a new npm dep, add it to `opencode/package.json` and note the reason in the plugin's opening comment.
3. Add the plugin to the `## Registry` above and to the `### Plugins` section of `opencode/.opencode/commands/sync-configs.md` so it propagates on `/sync-configs`.
4. No change to `opencode.jsonc` is needed — plugins are auto-discovered from `plugins/`.

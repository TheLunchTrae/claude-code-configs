# OpenCode configs — agent notes

# opencode.jsonc — permission notes

The `permission.bash` block is matched top-down with last-matching-pattern semantics, so denies must sit at the bottom to take precedence over broader allows or asks. The canonical order is **`allow` rules → `ask` rules → `deny` rules**, and each group is sorted alphabetically. Keep rules grouped and alphabetised on every edit.

The `permission.edit` is set to `"ask"` globally.

This directory contains OpenCode-specific configuration. It is not a Claude Code config directory — OpenCode reads `AGENTS.md`, `opencode.jsonc`, and files under `agents/`, `commands/`, and `skills/`. This `.claude/CLAUDE.md` file is read only by Claude Code agents working in this repository, not by OpenCode itself.

# Hooks are out of scope on the OpenCode side

OpenCode has no hooks system comparable to Claude Code's `settings.json.hooks`. The equivalent on the OC side is plugins — authored TypeScript modules under `opencode/plugins/` (see the Plugins section below). When a new capability is needed that would be a hook on CC, implement it as a plugin here instead; don't try to invent an OC hooks shim.

The CC side does version hooks under `hooks/` at the CC repo root. The opencode-mirror mapping reflects this directional asymmetry: CC hooks mirror to OC plugins manually (no automatic translation). Current pair: `hooks/block-secrets.sh` ↔ `opencode/plugins/block-secrets.ts`.

# READMEs

Each tracked subdirectory has a user-facing README that is a **pure TOC** — title plus the inventory table(s) for that directory, nothing else. No install instructions, no prose walkthroughs, no frontmatter schema, no authoring checklists. These READMEs ship to users via `/sync-configs`. Most use the `README.md` filename; the two inside OpenCode's agent/command discovery globs use `README.markdown` to avoid being loaded as phantom agents/commands (see the table below).

| README | Contents |
|--------|----------|
| `opencode/README.md` | Folder map — one row per subdirectory |
| `opencode/agents/README.markdown` | Agent roster tables grouped by category. Named `.markdown` (not `.md`) so OpenCode's `opencode/agents/*.md` discovery glob skips it — otherwise it gets loaded as a phantom agent. |
| `opencode/commands/README.markdown` | Slash-command catalogue grouped by workflow. Named `.markdown` (not `.md`) so OpenCode's `opencode/commands/*.md` discovery glob skips it — otherwise it gets loaded as a phantom command. |
| `opencode/skills/README.md` | Skill inventory (single table) |
| `opencode/plugins/README.md` | Plugin inventory (single table) |
| `opencode/.opencode/README.md` | `/sync-configs` usage blurb + files table. The only README that isn't a pure TOC — it documents the one command entry point exposed by this directory. |

**When you add, rename, or remove any agent / command / skill / plugin, update the matching README table in the same commit.** Keep rows terse — one line describing what the item does, following the existing pattern.

All authoring guidance (frontmatter schema, CC-only keys to strip, pre-commit checklist, per-plugin deep-dives, "Adding a new …" steps) lives only in this `.claude/CLAUDE.md`. Do not push any of it back into the user-facing READMEs.

# Frontmatter schema for agents, commands, and skills

Every file under `opencode/agents/`, `opencode/commands/`, and `opencode/skills/*/SKILL.md` has YAML frontmatter. Only the keys listed below are recognised by OpenCode — unknown keys are silently ignored, so unrecognised keys are not a runtime error but they signal configuration drift (usually leftover Claude Code keys from a lazy port). Authoritative source: <https://opencode.ai/docs/agents/>, <https://opencode.ai/docs/commands/>, <https://opencode.ai/docs/skills/>.

## Agents (`opencode/agents/*.md`)

| Key | Required | Notes |
|-----|----------|-------|
| `description` | yes | Trigger phrase used for agent discovery. |
| `mode` | no | `primary` / `subagent` / `all` (default `all`). |
| `model` | no | Override default LLM for this agent. |
| `temperature` | no | 0.0–1.0. |
| `top_p` | no | Alternative randomness control. |
| `steps` | no | Max agentic iterations. |
| `prompt` | no | Path to custom system prompt file. |
| `permission` | no | Nested map with `edit` / `bash` / `webfetch` / `task` keys set to `allow` / `ask` / `deny`. Overrides the global block in `opencode.jsonc`. |
| `color` | no | Hex (`"#8AF793"`) or theme colour name. |
| `disable` | no | `true` to disable without deleting. |
| `hidden` | no | `true` to hide from `@` autocomplete. |

## Commands (`opencode/commands/*.md`)

| Key | Required | Notes |
|-----|----------|-------|
| `description` | yes | Shown in TUI. |
| `agent` | no | Name of the delegating agent (must match a file in `opencode/agents/`). |
| `subtask` | no | `true` forces subagent invocation even when `agent` is `mode: primary`. |
| `model` | no | Override default LLM for this command. |

## Skills (`opencode/skills/<name>/SKILL.md`)

| Key | Required | Notes |
|-----|----------|-------|
| `name` | yes | Must match the containing directory name. |
| `description` | yes | Skill purpose. |
| `license`, `compatibility`, `metadata` | no | Rarely used; see docs. |

## Claude Code-only keys — strip when porting

These keys exist on the CC side and are **not** valid OpenCode frontmatter. They must be removed (or translated) when porting an agent / command / skill from `agents/` / `skills/` to `opencode/`:

- `tools:` on agents — deprecated in OpenCode. Translate to a `permission` block when the CC side restricts tools (e.g. a CC agent with `tools: ["Read", "Grep", "Glob"]` maps to `permission: { edit: deny, bash: deny }` on the OC side). Drop entirely when the CC side grants full access.
- `agent:`, `context:`, `allowed-tools:` on skills — CC skill-invocation keys with no OC skill analog. The OC equivalents live on the command wrapper (`agent:` + `subtask: true`), not on the skill.
- `disable-model-invocation:` on skills — CC-only. Pure-automation skills port to an OC command instead of an OC skill.

## Pre-commit checklist

Before committing any change to `opencode/agents/`, `opencode/commands/`, or `opencode/skills/`:

1. Open the file and confirm the frontmatter contains only keys from the tables above.
2. Confirm `tools:` is not present on any agent. `rg '^tools:' opencode/agents/` must return nothing.
3. If a `permission:` block is added or modified, confirm it sits inside the `---` frontmatter fence and is indented with two spaces for nested keys.

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

### /cleanup-artifacts — `opencode/commands/cleanup-artifacts.md`

Deletes artifacts under `~/.opencode-artifacts/`. Accepts zero, one, or two positional arguments: a project name removes all artifacts for that project, a command name removes that command's file from every project, both together (`<project> <command>`) deletes a single file, and no arguments deletes everything. Always lists files and asks for confirmation before deleting.

OpenCode-exclusive because: operates on `~/.opencode-artifacts/`, a convention that only exists for OpenCode sessions.

### /cleanup-memory — `opencode/commands/cleanup-memory.md`

Deletes memory entries under `~/.opencode-data/memory/`. Accepts combinable tokens: `global` / `project` / `<project-name>` for scope, `rules` / `facts` for kind, `domain:<x>` for facts filtering, or a kebab-case slug for a specific entry. No arguments wipes every rule and fact across every scope. Always uses `memory_list` to show matches and asks for confirmation before calling `memory_delete`.

OpenCode-exclusive because: operates on `~/.opencode-data/memory/`, a convention that only exists for OpenCode sessions.

### /review-memory — `opencode/commands/review-memory.md`

Walks every memory entry across project and global scopes via `memory_list { kind: "all", scope: "all" }`, applies model judgment to flag stale / redundant / contradictory / trivial entries, and prompts the user one at a time to delete, keep, or merge. Heavier than `/cleanup-memory` — use when you want guided pruning rather than executing a known scope.

OpenCode-exclusive because: operates on `~/.opencode-data/memory/`, a convention that only exists for OpenCode sessions.

### /sync-configs — `opencode/.opencode/commands/sync-configs.md`

Fetches the manifest at `opencode/.opencode/sync-configs-manifest.md` from `raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/` on every run (the local manifest is never consulted). Reads the `Version:` integer from the manifest and compares it against a project-scope memory fact (`memory_list` with `domain: "sync-configs"`, `slug: "last-version"`); if they match, the command short-circuits with `Already up to date (version <N>).` and fetches nothing further. On version mismatch, for each path in the manifest it fetches the remote copy (using `curl -fsSL` and rejecting empty / HTML-404 responses), compares it to the local copy under `~/.claude/`, and merges changes (prefer remote; auto-preserve only allowlisted regions like the `permission` block in `opencode.jsonc`; everything else surfaces to the user as `needs-user-decision`). A reconciliation step verifies every requested path is accounted for before the run can advance. Paths under the manifest's `## Deleted` section are removed from the local tree — but **only when the version fact already holds a prior value**; on first-run (no fact), deletions are skipped with a note so unrelated local files are never removed. The version fact is written via `memory_write` only when the run is fully clean (no failures, all `needs-user-decision` cases resolved); on partial failure the fact is left untouched so the next `/sync-configs` automatically retries. If the manifest fetch itself fails, the command aborts immediately and touches no local files. Reports updated, unchanged, deleted, and failed files.

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

Authored OpenCode plugins live in `opencode/plugins/`. They are TypeScript modules auto-discovered by OpenCode at session start. `opencode/package.json` + `opencode/tsconfig.json` exist so `bun install` at the config root resolves the plugin SDK (`@opencode-ai/plugin`) and types (`@types/node`, `typescript`) for editor tooling.

`opencode/package.json` is intentionally excluded from the `/sync-configs` manifest — OpenCode generates one automatically at runtime on a user's install, so syncing the committed copy would clobber theirs. It stays in this repo only to support local plugin-authoring IDE type-checking. `opencode/tsconfig.json` is still synced because OpenCode does not auto-generate it.

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
- **Custom tools** — registers `artifact_read`, `artifact_write`, `artifact_list`, and `artifact_delete`. These are the preferred API for `/handoff`, `/catchup`, and `/cleanup-artifacts`. Each tool accepts an optional `project` argument for cross-project access; omitted, it uses the current project resolved via the same git-remote → repo-dir → cwd fallback chain documented under "Artifact storage convention". `artifact_delete` requires `confirm: true` on every call as a guardrail; scope is implied by which of `command` / `project` are passed (both → single file, only `project` → all artifacts in that project, only `command` → that command's file across every project, neither → wipe all artifacts across all projects). Only `*.md` artifacts are touched in any scope; `memory/` subdirectories are never affected (they are managed exclusively by `memory_delete`).
- **Startup TTL prune** — on plugin init, fires a fire-and-forget pass that deletes any artifact whose `mtime` is older than `OPENCODE_ARTIFACT_TTL_DAYS` (default `90`). Set the env var to `0` to disable. Errors during the prune do not block plugin init; deletions are logged via `client.app.log` at `info` level when any occur.

### `plugins/memory.ts` — MemoryPlugin

- **Vocabulary** — **rule** = manually-authored behavioral directive (`trigger` + `note`); auto-injected every session. **Fact** = manually-authored context (`domain` + `note`); tool-gated. **Instinct** is *reserved* for a future observer-derived store (ECC-style: hook-captured traces → background agent extracts instincts with confidence/evidence). The current tool surface does NOT write `memory/instincts.txt` — that file is owned by the future observer only.
- **Scopes** — every entry is either `project` (default) or `global`. Global storage lives at `~/.opencode-artifacts/_global/memory/` and applies to every project. `_global` is a reserved project name; a repo literally named `_global` will share storage with the global scope.
- **`shell.env` hook** — injects `OPENCODE_MEMORY_DIR` (the current project's `memory/` directory) alongside the other plugin-set env vars.
- **`experimental.chat.system.transform` hook** — on every message, reads `_global/memory/rules.txt` + `<project>/memory/rules.txt` (globals first), and appends a single `Rules — follow when the "when" fires:` block to `output.system` with one `<trigger>: <note>` line per entry. Slugs and scope labels are dropped — the LLM only needs the directive, not the primary key or provenance. `INJECT_MAX_CHARS = 2000` (≈500 tokens) cap with `…` truncation footer prevents silent context bloat. Empty/missing files push nothing.
- **Custom tools** — registers `memory_list`, `memory_write`, and `memory_delete`.
  - Storage: pipe-delimited columns, no field names on disk.
    - `~/.opencode-artifacts/<project|_global>/memory/rules.txt` → `slug|trigger|note`
    - `~/.opencode-artifacts/<project|_global>/memory/facts.txt` → `slug|domain|note`
  - `memory_write` requires `kind: "rule" | "fact"` and accepts `scope: "project" | "global"` (default project). Rules require `trigger`; facts require `domain`. Values may not contain `|`, `\n`, or `\r`. Slugs (`^[a-z0-9][a-z0-9-]{0,63}$`) are unique per scope across both kinds — cross-kind collision within a scope errors with a "delete first" hint. Same slug may coexist across scopes (project may intentionally shadow global).
  - `memory_list` defaults `kind: "rules"` + `scope: "all"` (merges global + project sections, labeled). Supports `domain` filter for facts, exact-match `slug` lookup, `project` override.
  - `memory_delete` requires `confirm: true`. Accepts `slug` / `kind` / `scope` / `domain` / `project`. `scope` defaults to `"all"` — nothing-set call wipes both files across all scopes. `project` is invalid with `scope:"global"` or `"all"`.
- **Atomic writes** — `atomicReplace` writes to `<path>.tmp-<pid>-<ts>` then `rename`s onto the target so a crash mid-write can't leave a half-written file in place. Files are sorted lex-by-slug on write so diffs (if ever inspected) stay stable.
- **No TTL prune** — memory entries are durable by design. Pruning is manual via `memory_delete`.
- **Token-cost discipline** — positional pipe-delimited columns (no field names on disk); rules auto-injected as `<trigger>: <note>` with no slug/scope metadata; facts tool-gated so they cost nothing per session when irrelevant; `INJECT_MAX_CHARS` cap on the injected block. Tool descriptions carry the when-to-write / when-not-to-write guidance so it is visible at tool-call time. Note hard-cap remains 240 chars.
- **Shared helpers** — `ARTIFACT_ROOT`, `projectNameFromRemoteUrl`, `makeResolveProject`, `removeEmptyDir`, `DeleteResult`, and `deleteFile` live in `plugins/lib/project.ts` and are imported by both `memory.ts` and `artifacts.ts`. Edit there, not in copies.

### `plugins/block-secrets.ts` — BlockSecretsPlugin

- **`tool.execute.before` hook** — blocks reads of sensitive files (`.env`, `.env.*` except `*.example/sample/template/defaults/dist`, `*.pem`, SSH private keys, `*.key`, `credentials.json`, `.netrc`, `secrets.{json,yaml,yml}`, `*.p12`, `*.pfx`, `.aws/credentials`, anything under `.ssh/`).
- Applies to `read`, `glob`, `edit`, `write` tool calls (by inspecting their path argument) and to `bash` (by token-scanning the command for blocked paths).
- Safe-read exceptions live in `ALLOWED_BASENAMES` inside the plugin; extend the set if a legitimate template trips the block.

## When adding a new plugin

1. Create the TS file under `opencode/plugins/`.
2. If it needs a new npm dep, add it to `opencode/package.json` and note the reason in the plugin's opening comment.
3. Add the plugin to the `## Registry` above and to the `## Plugins` section of `opencode/.opencode/sync-configs-manifest.md` so it propagates on `/sync-configs`.
4. Add a one-line row for the new plugin to the table in `opencode/plugins/README.md`.
5. No change to `opencode.jsonc` is needed — plugins are auto-discovered from `plugins/`.

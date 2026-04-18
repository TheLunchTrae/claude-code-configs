# OpenCode configs

User-level [OpenCode](https://opencode.ai/) configuration — agents, commands, skills, plugins, and permissions. Mirrors (and in places diverges from) the Claude Code configs one directory up.

OpenCode reads this directory as-is when it's placed at `~/.config/opencode/` (or linked there). Everything here is user-facing config; nothing is generated.

## What's in here

| Path | Purpose | Docs |
|------|---------|------|
| [`AGENTS.md`](AGENTS.md) | Cross-agent instructions every agent inherits (general style, security, code review, testing, patterns, subagent index). Read first by every agent. | — |
| [`opencode.jsonc`](opencode.jsonc) | Global config: permission rules, plugin list, model, theme. `permission.bash` is matched top-down with last-match-wins, so denies sit at the bottom. | — |
| [`agents/`](agents/README.md) | Specialized subagents (planner, reviewers, language developers, cross-stack utilities). | [docs](https://opencode.ai/docs/agents/) |
| [`commands/`](commands/README.md) | Slash commands the user triggers from the TUI (`/plan`, `/commit`, `/handoff`, …). | [docs](https://opencode.ai/docs/commands/) |
| [`skills/`](skills/README.md) | Model-invocable procedures selected automatically from trigger-phrase descriptions. | [docs](https://opencode.ai/docs/skills/) |
| [`plugins/`](plugins/README.md) | TypeScript modules that register tools and subscribe to lifecycle hooks (auto-injected rules, secret blocking, artifact storage). | [docs](https://opencode.ai/docs/plugins/) |
| [`.opencode/`](.opencode/) | Distribution infrastructure — `sync-configs` command and its manifest. Users installing from upstream use `/sync-configs` to pull latest. | — |

## Getting started

### Install from upstream

If you already have OpenCode running and want these configs:

```bash
# Run inside an OpenCode session:
/sync-configs
```

That command fetches the manifest from `raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/.opencode/sync-configs-manifest.md`, pulls each file listed there, and merges them into `~/.config/opencode/`.

### Install from source

```bash
git clone https://github.com/TheLunchTrae/claude-code-configs.git
cp -r claude-code-configs/opencode/* ~/.config/opencode/
cd ~/.config/opencode && bun install  # for plugin type-checking; optional
```

## What happens in a session

1. OpenCode reads `opencode.jsonc` (permissions, plugin list, theme).
2. OpenCode reads `AGENTS.md` — its contents join the system prompt for every agent.
3. OpenCode scans `agents/*.md`, `commands/**/*.md`, `skills/*/SKILL.md`, `plugins/*.ts` and registers each.
4. Each plugin's `Plugin` function runs, setting up tools and lifecycle hooks.
5. The user's first message arrives. The [memory plugin](plugins/README.md#memoryts--memoryplugin) appends auto-injected rules (project + global) to the system prompt before the LLM sees it.
6. The model works. Any slash command, agent delegation, or tool call routes through the configured entries.
7. On session end, [block-secrets](plugins/README.md#block-secretsts--blocksecretsplugin) has been gating sensitive file reads throughout; [artifacts](plugins/README.md#artifactsts--artifactsplugin) has persisted any `/handoff` calls.

## Authoring quickstart

- **Add an agent** — new file in `agents/`, frontmatter per the [schema](agents/README.md#frontmatter-schema), update the subagents index in `AGENTS.md`, add to the sync manifest.
- **Add a command** — new file in `commands/`, frontmatter with `description:` (and `agent:` if delegating), add to the sync manifest.
- **Add a skill** — new directory `skills/<name>/SKILL.md` with `name:` matching the directory, strong trigger-phrase `description:`, add to the sync manifest.
- **Add a plugin** — new `plugins/<name>.ts` exporting an async `Plugin` function, add to the sync manifest. Verify hook signatures against the [plugin SDK source](https://github.com/anomalyco/opencode/tree/dev/packages/plugin) before wiring new events.

Each subdirectory README has the full checklist.

## Permissions

`opencode.jsonc` sets global permission defaults. Per-agent overrides live in each agent file's frontmatter under a `permission:` block. The canonical ordering inside a permission block is **`allow` → `ask` → `deny`**, grouped and alphabetised, because `permission.bash` is last-match-wins.

Globally, `permission.edit` is `"ask"` — every edit prompts before it runs unless an agent explicitly overrides.

## Conventions used throughout

- **Artifact storage**: `~/.opencode-artifacts/<project>/<command>.md`. `<project>` resolves from git remote → repo basename → cwd basename. Used by `/handoff`, `/catchup`, memory, and the artifacts plugin.
- **Memory storage**: pipe-delimited files under `~/.opencode-artifacts/<project>/memory/` (and `_global/memory/` for global scope). See the [plugins README](plugins/README.md#memoryts--memoryplugin).
- **Commit messages**: imperative mood, lowercase, no type prefix. No Claude Code session-link trailers.
- **File length**: 200–400 lines typical, 800 max. Extract once a file exceeds that.

## Related

- This repo also maintains parallel Claude Code configs at the root (`rules/`, `agents/`, `skills/`, `settings.json`). Changes start on the Claude Code side and mirror here via the `/opencode-mirror` skill — see [`.claude/CLAUDE.md`](../.claude/CLAUDE.md) in the repo root for the full mapping.
- For internal contributor notes specific to this directory (frontmatter schema tables, OpenCode-exclusive commands registry, distribution manifest rules), see [`.claude/CLAUDE.md`](.claude/CLAUDE.md).

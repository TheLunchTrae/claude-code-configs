# OpenCode configs

| Folder | What's in it | Read this for |
|--------|--------------|---------------|
| [`agents/`](agents/README.markdown) | Specialized assistants OpenCode delegates to for focused work | An overview of who's available and what each is good at |
| [`commands/`](commands/README.markdown) | Slash commands you trigger from the TUI | The full list, grouped by what you're trying to do |
| [`skills/`](skills/README.md) | Procedures the AI picks automatically based on your task | When skills fire and which ones ship here |
| [`plugins/`](plugins/README.md) | Background extensions (memory, secret blocking, session handoffs) | What runs silently behind every session |
| [`.opencode/`](.opencode/README.md) | The `/sync-configs` command + its manifest | How to sync these configs from the upstream GitHub repo into your install |
| `instructions/` | Shared rules every agent follows (style, security, review standards), one file per topic | If you want to know why the AI is consistent across agents |
| `opencode.jsonc` | Global settings: permissions, theme, which plugins run, and the `instructions` array that pulls in `instructions/*.md` | If you want to flip a permission or change the model |
| `.config-dir` | Sentinel file holding the absolute path of this config dir. Written by the `instructions-base` plugin on every session start; referenced from `opencode.jsonc` via `{file:.config-dir}` so the `instructions` array works regardless of where OpenCode is launched | You usually don't need to touch this |

## First-time setup — installing without cloning

If you don't want to clone this repo (or can't — restricted environment, ephemeral box) but still want to stay in sync with upstream, install just the `/sync-configs` plugin from `.opencode/plugins/sync-configs.ts`. It's a small project-local OpenCode plugin that fetches every file listed above from this repo on demand and keeps them current. After bootstrap, re-run `/sync-configs` any time to pull updates.

Run this once from your OpenCode config root (the directory that contains your `.opencode/`):

```sh
mkdir -p .opencode/plugins .opencode/commands && \
  curl -fsSL -o .opencode/plugins/sync-configs.ts   https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/.opencode/plugins/sync-configs.ts && \
  curl -fsSL -o .opencode/commands/sync-configs.md  https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/.opencode/commands/sync-configs.md && \
  curl -fsSL -o .opencode/tsconfig.json             https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/.opencode/tsconfig.json && \
  echo "Done. Restart OpenCode, then run /sync-configs."
```

Then restart OpenCode so the plugin loads, and run `/sync-configs` to pull the rest of the configs.

### Windows first-run note

`/sync-configs` ships `.config-dir` with the placeholder `~/.config/opencode`, which OpenCode's `~/` expansion resolves correctly on Linux/macOS. On Windows the placeholder won't resolve, so the very first OpenCode session after install loads with the rule files missing. The `instructions-base` plugin overwrites `.config-dir` with the correct platform-specific path on that first session, so a single restart is all that's needed before subsequent sessions see the rules.

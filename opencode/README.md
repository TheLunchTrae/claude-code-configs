# OpenCode configs

| Folder | What's in it | Read this for |
|--------|--------------|---------------|
| [`agents/`](agents/README.markdown) | Specialized assistants OpenCode delegates to for focused work | An overview of who's available and what each is good at |
| [`commands/`](commands/README.markdown) | Slash commands you trigger from the TUI | The full list, grouped by what you're trying to do |
| [`skills/`](skills/README.md) | Procedures the AI picks automatically based on your task | When skills fire and which ones ship here |
| [`plugins/`](plugins/README.md) | Background extensions (memory, secret blocking, session handoffs) | What runs silently behind every session |
| [`.opencode/`](.opencode/README.md) | The `/sync-configs` command + its manifest | How to sync these configs from the upstream GitHub repo into your install |
| `AGENTS.md` | Shared rules every agent follows (style, security, review standards) | If you want to know why the AI is consistent across agents |
| `opencode.jsonc` | Global settings: permissions, theme, which plugins run | If you want to flip a permission or change the model |

## First-time setup — installing without cloning

If you don't want to clone this repo (or can't — restricted environment, ephemeral box) but still want to stay in sync with upstream, install just the `/sync-configs` plugin from `.opencode/plugins/sync-configs.ts`. It's a small project-local OpenCode plugin that fetches every file listed above from this repo on demand and keeps them current. After bootstrap, re-run `/sync-configs` any time to pull updates.

Run this once from your OpenCode config root (the directory that contains your `.opencode/`):

```sh
mkdir -p .opencode/plugins && \
  curl -fsSL -o .opencode/plugins/sync-configs.ts https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/.opencode/plugins/sync-configs.ts && \
  curl -fsSL -o .opencode/tsconfig.json           https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/.opencode/tsconfig.json && \
  echo "Done. Restart OpenCode, then run /sync-configs."
```

Then restart OpenCode so the plugin loads, and run `/sync-configs` to pull the rest of the configs.

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

## First-time setup

`/sync-configs` (the command that pulls everything else listed above from the upstream GitHub repo) is implemented by a project-local plugin at `.opencode/plugins/sync-configs.ts`. If you cloned this repo into your config directory, you already have it — skip to the [`.opencode/` usage docs](.opencode/README.md). If you started from an empty config directory, run this once from the OpenCode config root (the directory containing your `.opencode/`):

```sh
mkdir -p .opencode/plugins && \
  curl -fsSL -o .opencode/plugins/sync-configs.ts https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/.opencode/plugins/sync-configs.ts && \
  curl -fsSL -o .opencode/tsconfig.json           https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/.opencode/tsconfig.json && \
  echo "Done. Restart OpenCode, then run /sync-configs."
```

Then restart OpenCode so the plugin loads, and run `/sync-configs` to pull the rest of the configs.

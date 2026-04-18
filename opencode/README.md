# OpenCode configs

| Folder | What's in it | Read this for |
|--------|--------------|---------------|
| [`agents/`](agents/README.md) | Specialized assistants OpenCode delegates to for focused work | An overview of who's available and what each is good at |
| [`commands/`](commands/README.md) | Slash commands you trigger from the TUI | The full list, grouped by what you're trying to do |
| [`skills/`](skills/README.md) | Procedures the AI picks automatically based on your task | When skills fire and which ones ship here |
| [`plugins/`](plugins/README.md) | Background extensions (memory, secret blocking, session handoffs) | What runs silently behind every session |
| [`.opencode/`](.opencode/) | Wiring for the `/sync-configs` command | You shouldn't need to edit it |
| `AGENTS.md` | Shared rules every agent follows (style, security, review standards) | If you want to know why the AI is consistent across agents |
| `opencode.jsonc` | Global settings: permissions, theme, which plugins run | If you want to flip a permission or change the model |

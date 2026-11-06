# claude-code-configs

Hand-authored Claude Code config from `~/.claude`, kept so it's easy to move to a new machine.

Some things already follow your Claude account and don't need to live here: claude.ai connectors (MCP servers), synced plugins, and synced skills.

## Install

Copy files into `~/.claude`:

```sh
cp settings.json ~/.claude/settings.json
```

Claude Code edits `settings.json` itself (for example, when you click "always allow"). Copy useful changes back here now and then.

## What belongs here
- `settings.json`: permissions, hooks, status line, env (no secrets)
- `CLAUDE.md`: global instructions
- `agents/`, `skills/`, `commands/`, `hooks/`: anything custom

## What doesn't
Credentials, `~/.claude.json`, `settings.local.json`, history, `projects/`, and anything synced from your account. See `.gitignore`.

# claude-code-configs

Hand-authored Claude Code config from `~/.claude`, kept so it's easy to move to a new machine.

Some things already follow your Claude account and don't need to live here: claude.ai connectors (MCP servers), synced plugins, and synced skills.

| File | Goes to | What |
| --- | --- | --- |
| `settings.json` | `~/.claude/settings.json` | Theme, destructive-command denies, status line, hooks |
| `CLAUDE.md` | `~/.claude/CLAUDE.md` | Global instructions |
| `statusline.sh` | `~/.claude/statusline.sh` | `Opus 5.5 · repo (branch) · ctx 23% · 5h 41%`, color-coded |
| `hooks/block-secrets.sh` | `~/.claude/hooks/block-secrets.sh` | Blocks Read/Edit/Write/Grep/Bash on `.env`, keys, `.ssh/`, cloud credentials |

## Install

Requires `jq`, which ships with macOS 15+. Without it the hook fails closed and blocks every call it checks.

```sh
mkdir -p ~/.claude/hooks
cp settings.json CLAUDE.md statusline.sh ~/.claude/
cp hooks/block-secrets.sh ~/.claude/hooks/
```

Claude Code edits `settings.json` itself (for example, when you click "always allow"). Copy useful changes back here now and then.

## Notes
- The deny list catches the common spellings (`rm -rf`, `rm -fr`, `git push -f`, ...), not every variant. It's a guardrail, not a sandbox.
- The secrets hook is deliberately conservative. If it blocks something legitimate, add the pattern to `ALLOWED` in the script.

## What doesn't belong here
Credentials, `~/.claude.json`, `settings.local.json`, history, `projects/`, and anything synced from your account. See `.gitignore`.

# claude-code-configs

Hand-authored Claude Code config. The repo is checked out directly as `~/.claude`, so `git pull` there updates the live config. `.gitignore` allows only the files below; everything else Claude Code writes to `~/.claude` stays untracked.

Some things already follow your Claude account and don't need to live here: claude.ai connectors (MCP servers), synced plugins, and synced skills.

| File | What |
| --- | --- |
| `settings.json` | Theme, destructive-command denies, status line, hooks |
| `CLAUDE.md` | Global instructions (ported from OpenCode `AGENTS.md`) |
| `references/*.md` | Coding style, docs standard, testing standards, verification scope. Read only when `CLAUDE.md` or a skill says to |
| `skills/*/SKILL.md` | Ported from OpenCode. Language/stack skills (`go`, `typescript`, `csharp`, `php`, `persistence`, `ci`) load automatically; the rest are also `/name` commands |
| `statusline.sh` | `Opus 5.5 · repo (branch) · ctx 23% · 5h 41%`, color-coded |
| `hooks/block-secrets.sh` | Blocks Read/Edit/Write/Grep/Bash on `.env`, keys, `.ssh/`, cloud credentials |

## Set up on a new machine

Requires `jq`, which ships with macOS 15+. Without it the hook fails closed and blocks every call it checks.

`~/.claude` usually exists already, so `git clone` into it fails. Instead, initialize it in place; this overwrites any tracked files already there:

```sh
cd ~/.claude
git init -b main
git remote add origin https://github.com/TheLunchTrae/claude-code-configs.git
git fetch origin
git checkout -f -t origin/main
```

## Updating

- Pull: `git -C ~/.claude pull`
- Claude Code edits `settings.json` itself (for example, when you click "always allow"). Those edits show up in `git status`; commit the ones worth keeping.

## Notes
- The deny list catches the common spellings (`rm -rf`, `rm -fr`, `git push -f`, ...), not every variant. It's a guardrail, not a sandbox.
- The secrets hook is deliberately conservative. If it blocks something legitimate, add the pattern to `ALLOWED` in the script.

## What doesn't belong here
Credentials, `~/.claude.json`, `settings.local.json`, history, `projects/`, and anything synced from your account. See `.gitignore`.

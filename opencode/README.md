# OpenCode configs

This folder is a complete [OpenCode](https://opencode.ai/) setup — the agents, slash commands, skills, and background plugins that shape how OpenCode behaves in your terminal. Drop it at `~/.config/opencode/` (or keep it here and link it) and OpenCode will pick up everything automatically on next launch.

## What you get

- **A roster of specialized agents** — a planner, reviewers (general, security, language-specific), and language/framework developers — that OpenCode can delegate to instead of doing everything in one stream.
- **Slash commands** for the things you do dozens of times a day: `/plan`, `/commit`, `/review`, `/handoff`, `/catchup`, plus language- and security-specific reviews.
- **Durable memory** that carries rules and facts across sessions so you don't repeat yourself. Rules are auto-loaded every time you start a session.
- **Secret-read protection** that blocks the AI from reading `.env` files, private keys, and other sensitive paths.
- **Session handoffs** so you can stop mid-task, come back later, and run `/catchup` to resume.
- **A one-command sync** (`/sync-configs`) that pulls the latest version of these configs from GitHub without cloning the whole repo.

## Installing

### If you already use OpenCode

Inside an OpenCode session, run:

```
/sync-configs
```

It fetches the list of files from this repo and merges them into `~/.config/opencode/`, asking before touching anything it's unsure about.

### From source

If you'd rather bootstrap by hand, copy the contents of this `opencode/` folder into `~/.config/opencode/`. Everything under this directory is what OpenCode will read.

Optional: `cd ~/.config/opencode && bun install` sets up editor type-checking if you plan to edit plugins. Not needed for normal use.

## What's in each folder

| Folder | What's in it | Read this for |
|--------|--------------|---------------|
| [`agents/`](agents/README.md) | Specialized assistants OpenCode delegates to for focused work | An overview of who's available and what each is good at |
| [`commands/`](commands/README.md) | Slash commands you trigger from the TUI | The full list, grouped by what you're trying to do |
| [`skills/`](skills/README.md) | Procedures the AI picks automatically based on your task | When skills fire and which ones ship here |
| [`plugins/`](plugins/README.md) | Background extensions (memory, secret blocking, session handoffs) | What runs silently behind every session |
| [`.opencode/`](.opencode/) | Wiring for the `/sync-configs` command | You shouldn't need to edit it |
| `AGENTS.md` | Shared rules every agent follows (style, security, review standards) | If you want to know why the AI is consistent across agents |
| `opencode.jsonc` | Global settings: permissions, theme, which plugins run | If you want to flip a permission or change the model |

## A typical session, step by step

1. You open OpenCode in a project directory.
2. The memory plugin loads your rules (project-specific + global) and inserts them into the AI's system prompt. You don't see this happen.
3. You type something — say, *"let's add a new GitHub Actions workflow for the release job"*.
4. OpenCode decides whether a skill matches (e.g. if you said "plan this out"), or whether to route to an agent (e.g. `github-actions-developer`).
5. As the AI works, the secret-blocking plugin quietly rejects any attempt to read `.env` or SSH keys.
6. You hit a stopping point and run `/handoff`. A summary lands at `~/.opencode-artifacts/<project>/handoff.md`.
7. Next session, `/catchup` reads that handoff and orients the AI to where you left off.

None of this requires configuration from you — the defaults Just Work once the configs are in place.

## Day-one things worth knowing

- **Permissions default to asking.** Any file edit prompts for confirmation before it runs. You can loosen this per-agent in each agent's frontmatter, or globally in `opencode.jsonc`.
- **Everything written to disk beyond your project lives at `~/.opencode-artifacts/`.** Handoffs, memory files, whatever. Safe to `rm -rf` if you want to reset.
- **Nothing phones home.** All memory and artifacts are local files. No external services, no embeddings APIs.
- **You can teach it.** When you catch yourself saying *"remember that in this repo we…"*, ask it to `memory_write` that. Future sessions will start already knowing.

## For contributors to this repo

Each subdirectory README has an "Adding a new …" section for when you want to write your own agent, command, skill, or plugin. OpenCode auto-discovers any new files you drop in the right folder — no registry to update, no restart required beyond opening a new session.

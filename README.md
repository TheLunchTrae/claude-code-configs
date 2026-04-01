# claude-code-configs

This repository is a versioned backup of a personal `~/.claude` directory for [Claude Code](https://claude.ai/code). It exists to make migrating Claude Code configuration to a new machine straightforward.

**To AI reading this:** this is a config repo, not a software project. There is no application to build or run. Files here are Claude Code configuration — instructions, agent definitions, slash commands, and settings.

## What's here

```
CLAUDE.md              Project-level instructions loaded by Claude Code on every session.
settings.json          Claude Code settings: tool permissions, enabled plugins, update channel.

agents/
  developer.md         Subagent prompt for implementing code changes.
  reviewer.md          Subagent prompt for reviewing designs and implementations.

commands/
  branch.md            /branch  – summarize all changes on the current branch.
  commit.md            /commit  – stage and commit changes with a reasoned commit message.
  review.md            /review  – delegate a code review to the reviewer agent.
```

## Migrating to a new machine

1. Install Claude Code.
2. Clone this repo into `~/.claude`:
   ```sh
   git clone git@github.com:thelunchtrae/claude-code-configs.git ~/.claude
   ```
3. Reinstall any plugins listed as enabled in `settings.json` — they are excluded from the repo (see `.gitignore`) but the enabled set is captured there.

## What's excluded

See `.gitignore` for the full list. Short version: credentials, session data, conversation history, caches, plugins, and runtime-generated directories are all excluded. Only configuration that is worth versioning is committed.

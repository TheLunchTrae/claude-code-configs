# claude-code-configs

This repository is a versioned backup of a personal `~/.claude` directory for [Claude Code](https://claude.ai/code). It exists to make migrating Claude Code configuration to a new machine straightforward.

## Migrating to a new machine

1. Install Claude Code.
2. Clone this repo into `~/.claude`:
   ```sh
   git clone git@github.com:thelunchtrae/claude-code-configs.git ~/.claude
   ```
3. Reinstall any plugins listed as enabled in `settings.json` — they are excluded from the repo (see `.gitignore`) but the enabled set is captured there.

## Attribution

These configs are based heavily on the work in [everything-claude-code](https://github.com/affaan-m/everything-claude-code/tree/main/.opencode) by affaan-m.

## OpenCode configurations

The `opencode/` directory contains OpenCode equivalents of the Claude Code configurations in this repo. They are kept as close as possible to their Claude Code counterparts, but are not 1-1 due to functionality differences and limitations between the two tools.

## What's excluded

See `.gitignore` for the full list. Short version: credentials, session data, conversation history, caches, plugins, and runtime-generated directories are all excluded. Only configuration that is worth versioning is committed.

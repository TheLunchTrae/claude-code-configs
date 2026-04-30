# .opencode/

Houses `/sync-configs` — the command for pulling these OpenCode configs from the upstream GitHub repo into your local install without cloning.

First-time setup (curl the plugin file into place from a fresh OpenCode config dir) lives at the OpenCode config root [`README.md`](../README.md#first-time-setup), not here — by the time this file is on disk, you've already bootstrapped.

## Usage

1. Open your OpenCode config directory in OpenCode (usually `cd ~/.config/opencode && opencode`).
2. Run `/sync-configs`. It fetches the manifest from upstream, then every file listed in it, merging into the current directory. You're asked before overwriting files where local customization is ambiguous.

## Files

| File | What it does |
|------|--------------|
| `commands/sync-configs.md` | The slash-command implementation — thin wrapper that calls the `sync-configs` plugin tools and surfaces decisions. |
| `plugins/sync-configs.ts` | The plugin that does the work. Auto-discovered as a project-local plugin when OpenCode loads this `.opencode/` config dir. |
| `tsconfig.json` | Project-local TypeScript config covering `plugins/**/*.ts` here under `.opencode/`. Editor-only; OpenCode bundles its own TS support at runtime. |
| `sync-configs-manifest.json` | List of files `/sync-configs` ships. Fetched fresh from upstream on every run; the local copy is never consulted. |

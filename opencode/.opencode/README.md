# .opencode/

Houses `/sync-configs` — the command for pulling these OpenCode configs from the upstream GitHub repo into your local install without cloning.

## First-time setup

`/sync-configs` is implemented by a project-local plugin (`.opencode/plugins/sync-configs.ts`) that must be present locally before the command will run. If you cloned this repo into your config directory, you already have it — skip to **Usage** below. If you started from an empty config directory, run this once from the OpenCode config root (the directory containing your `.opencode/`):

```sh
mkdir -p .opencode/plugins && \
  curl -fsSL -o .opencode/plugins/sync-configs.ts https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/.opencode/plugins/sync-configs.ts && \
  curl -fsSL -o .opencode/tsconfig.json           https://raw.githubusercontent.com/thelunchtrae/claude-code-configs/main/opencode/.opencode/tsconfig.json && \
  echo "Done. Restart OpenCode, then run /sync-configs."
```

Then restart OpenCode so the plugin loads (OpenCode auto-installs `@opencode-ai/plugin` for each config dir at startup), and run `/sync-configs` to pull the rest of the configs.

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

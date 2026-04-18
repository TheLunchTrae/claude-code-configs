# .opencode/

Houses `/sync-configs` — the command for pulling these OpenCode configs from the upstream GitHub repo into your local install without cloning.

## Usage

1. Open your OpenCode config directory in OpenCode (usually `cd ~/.config/opencode && opencode`).
2. Run `/sync-configs`. It fetches the manifest from upstream, then every file listed in it, merging into the current directory. You're asked before overwriting files where local customization is ambiguous.

## Files

| File | What it does |
|------|--------------|
| `commands/sync-configs.md` | The slash-command implementation. |
| `sync-configs-manifest.md` | List of files `/sync-configs` ships. Fetched fresh from upstream on every run; the local copy is never consulted. |

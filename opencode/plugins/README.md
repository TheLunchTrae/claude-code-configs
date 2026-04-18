# Plugins

Plugins are small TypeScript files that run in the background on every session and quietly extend what OpenCode can do. You don't invoke them directly — they wire themselves into OpenCode's lifecycle and surface extra capabilities through tools, system-prompt additions, or guardrails.

The three plugins shipped here give you:

1. **Memory that persists across sessions.** You can have the AI remember rules and facts about a repo once, and future sessions start already knowing.
2. **Session handoffs.** Stop mid-task, come back tomorrow, pick up where you left off.
3. **Secret-read protection.** The AI can't read `.env` files, SSH keys, or credentials files by accident.

## Memory

File: `memory.ts`. Storage: `~/.opencode-artifacts/<project>/memory/` and `~/.opencode-artifacts/_global/memory/`.

The memory plugin maintains two kinds of entries:

- **Rules** — short behavioral directives tied to a trigger condition. Example: *"when committing: use conventional commits with scope prefix"*. Rules are **auto-injected into every session's system prompt**, so the AI always follows them without being reminded.
- **Facts** — short contextual notes tied to a category. Example: *"domain: testing — run pnpm test:unit --runInBand for DB tests"*. Facts are **not** auto-loaded; the AI pulls them only when it asks for them.

Both come in two **scopes**:

- **Project scope** (default) — applies only to the current repo.
- **Global scope** — applies to every project. Good for universally-true preferences (security posture, git hygiene, code style you hold everywhere).

### How you use it

Day-to-day, you just… talk. When you catch yourself saying *"remember that in this repo we always…"*, ask the AI to write it down. It will call `memory_write` with a rule or a fact. Next session you open here, the rule is already loaded.

To see what's stored, ask the AI to run `memory_list`. To remove something, `memory_delete`.

### What gets auto-loaded

Only rules, and only their condition and directive — slugs and scope labels are stripped to save tokens. The AI never sees the file format on disk, just a clean "Rules — follow when the 'when' fires:" block:

```
Rules — follow when the "when" fires:
before git push: Never force-push shared branches
when committing: Use conventional commits with scope prefix
```

The injected block is hard-capped at ~500 tokens; past that, it truncates with a pointer to `memory_list` for the full set.

### Reserved: instincts

`memory/instincts.txt` is **reserved** for a future observer-derived store. The idea: a background agent watches session traces, extracts patterns, and files them with confidence scores — ECC-style continuous learning. That doesn't exist yet. No current tool reads or writes that file.

## Artifacts (session handoffs)

File: `artifacts.ts`. Storage: `~/.opencode-artifacts/<project>/<command>.md`.

When you run `/handoff`, the artifacts plugin saves a structured summary of your session (what you were working on, what's done, what's next, which files changed) to a markdown file keyed by project and command name. Next time you open OpenCode in the same project, `/catchup` reads that file and orients the AI.

You can list, read, and delete artifacts with the corresponding `artifact_*` tools, but usually you'll just use the slash commands.

Artifacts older than 90 days are pruned automatically on session start. Set `OPENCODE_ARTIFACT_TTL_DAYS=0` in your environment to disable pruning, or to any other number to change the window.

## Block-secrets

File: `block-secrets.ts`.

Silently blocks the AI from reading sensitive files no matter which tool it tries to use:

- `.env` and `.env.*` (except common templates like `.env.example`, `.env.sample`)
- `*.pem`, `*.key`, SSH private keys, anything under `.ssh/`
- `credentials.json`, `.netrc`, `secrets.{json,yaml,yml}`, `.aws/credentials`
- `*.p12`, `*.pfx` keystores

This applies to read, glob, edit, and write operations (by checking the path argument) and to bash commands (by scanning the command line for blocked paths). If a legitimate template file matches a blocked pattern, add its basename to the `ALLOWED_BASENAMES` list inside the plugin.

## For plugin authors

Plugins are TypeScript files auto-discovered from this directory. Each exports an async function typed as `Plugin` from `@opencode-ai/plugin`. The function runs once at session start, receives `{ $, directory, project, client, … }`, and returns an object of hook handlers and tool definitions.

### Key references

- OpenCode plugin docs: <https://opencode.ai/docs/plugins/>
- Plugin SDK source (authoritative type signatures): <https://github.com/anomalyco/opencode/tree/dev/packages/plugin>
  - `src/index.ts` — the `Hooks` interface lists every lifecycle event (session start, each chat message, each tool call, system-prompt transform, etc.) with exact input/output types.
  - `src/tool.ts` — the `tool()` helper and `tool.schema` (a re-export of zod) for defining model-callable tools.

The docs page lags the SDK source. When in doubt, read `src/index.ts`.

### What's in `lib/`

`lib/project.ts` holds helpers shared between `artifacts.ts` and `memory.ts` — project-name resolution (git remote → repo basename → cwd basename), empty-directory cleanup, and delete result accumulation. Edit here rather than copying into individual plugins.

### Dependencies

The only runtime dependency is `@opencode-ai/plugin`. Prefer Node/Bun built-ins; only add an npm runtime dep when the value clearly outweighs the install surface. `bun install` at `opencode/` is only for local editor type-checking — those dev deps don't ship to users.

### Adding a new plugin

1. Create `plugins/<name>.ts` exporting an async `Plugin` function.
2. If a new runtime dep is required, add it to `opencode/package.json` and note the reason in the plugin's opening comment.
3. Add the file to `opencode/.opencode/sync-configs-manifest.md` under `## Plugins`.
4. Add a section above describing what it does for the user.
5. No change to `opencode.jsonc` is needed — plugins are auto-discovered.

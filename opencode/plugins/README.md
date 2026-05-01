# Plugins

| Plugin | What it does |
|--------|--------------|
| `memory.ts` | Persists rules and facts across sessions. Rules (auto-injected into every system prompt) and facts (pulled on demand) live under `~/.opencode-data/memory/<project>/` and `~/.opencode-data/memory/_global/`. Exposes `memory_write`, `memory_list`, `memory_delete`. |
| `artifacts.ts` | Session handoffs. `/handoff` writes a structured summary to `~/.opencode-data/artifacts/<project>/<command>.md`; `/catchup` reads it back next session. Artifacts older than 90 days prune on session start (`OPENCODE_ARTIFACT_TTL_DAYS` overrides). |
| `block-secrets.ts` | Silently blocks reads of `.env*`, `*.pem`, `*.key`, SSH private keys, `credentials.json`, `.netrc`, `secrets.{json,yaml,yml}`, `.aws/credentials`, `*.p12`, `*.pfx` — across read / glob / edit / write / bash. |
| `instructions-base.ts` | Writes the OpenCode config dir's absolute, forward-slash path to `<configdir>/.config-dir` on every session start. Lets `opencode.jsonc`'s `instructions` array reference rule files via `{file:.config-dir}/instructions/...` so absolute paths work cross-platform regardless of cwd. |

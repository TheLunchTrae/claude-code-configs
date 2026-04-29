# Slash commands

### Day-to-day workflow

| Command | What it does |
|---------|--------------|
| `/plan` | Draft an implementation plan for the current task — file paths, risks, dependencies. No code is written; it waits for your approval before executing. |
| `/phased-plan` | Same as `/plan` but produces a phased rollout — independently mergeable phases with migration timeline, backwards-compat scaffolding, and per-phase rollback. Use when shipping atomically isn't safe. |
| `/design` | Produce an architectural design: components, data flow, trade-offs, alternatives. Used when the "how" isn't settled. |
| `/orchestrate` | Sequence multiple agents when a task spans several specialties. |
| `/verify` | Run the verification loop (tests, linters, typecheck) and report. |

### Reviewing code

| Command | What it does |
|---------|--------------|
| `/review` | Lightweight review of recent changes with findings. |
| `/code-review` | Comprehensive review of staged + unstaged changes. Returns severity-graded findings (CRITICAL / HIGH / MEDIUM / LOW) and an approval verdict. |
| `/security-review` | OWASP Top 10 + common vulnerabilities. CRITICAL / HIGH findings block progress until resolved. |
| `/go-review` | Go-specific idiomatic review. |

### Refactoring and cleanup

| Command | What it does |
|---------|--------------|
| `/refactor-clean` | Find unused code, dead dependencies, duplicated logic. Categorizes findings by risk (SAFE / CAREFUL / RISKY), removes only the SAFE ones, and verifies with tests between batches. |
| `/update-docs` | Update documentation to reflect the code changes in the current session. |

### Git

| Command | What it does |
|---------|--------------|
| `/commit` | Stage and commit changes with a conventional-commits message. |
| `/commit-push` | Same as `/commit` but pushes afterward. |
| `/push` | Push the current branch to the remote. |
| `/summarize-branch` | Summarize every commit on the current branch — useful before opening a PR. |

### Output style

| Command | What it does |
|---------|--------------|
| `/caveman` | Toggle token-efficient response mode — terse fragments, drops filler/pleasantries, keeps technical substance exact. Optional intensity arg: `lite`, `full` (default), `ultra`. Say "stop caveman" to revert. |

### Session continuity

| Command | What it does |
|---------|--------------|
| `/handoff` | Save a structured summary of where you are so a future session can resume. Overwrites the previous handoff for this project on each run. Use when you need to step away mid-task. |
| `/catchup` | Read that handoff and orient the AI to resume. First thing to run when you come back. |
| `/cleanup-artifacts` | Delete saved artifacts. Accepts zero, one, or two positional args to scope by project, by command, or both. Always asks before deleting. |

### Storage management

| Command | What it does |
|---------|--------------|
| `/cleanup-memory` | Delete memory entries (rules and facts). Combinable tokens — `global`/`project`/`<name>`, `rules`/`facts`, `domain:<x>`, a kebab-case slug — to scope; no args wipes everything. Always asks before deleting. |
| `/manage` | Multi-verb management for artifacts and memory: `rename` a project's storage, `review` for stale entries, `copy` across projects, `promote` / `demote` memory between project and global scopes. Use for multi-step workflows; stays alongside the one-shot `/cleanup-*` commands. |

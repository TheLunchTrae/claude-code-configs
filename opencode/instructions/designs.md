# Design Records (Architectural Memory)

Designs capture non-obvious architectural decisions and complex implementation plans so future sessions can recover *why* choices were made, not just *what* exists. They are long-lived per-project memory, stored as a single markdown file per topic at `~/.opencode-artifacts/<project>/designs/<topic>.md` and managed via the `design_read`, `design_write`, `design_list`, and `design_delete` tools.

Designs are the durable counterpart to `/handoff`: handoffs are ephemeral session context, designs are permanent architectural record.

## When to write a design

Call `design_write` when any of these apply:

- An architectural decision with non-obvious tradeoffs (storage layout, protocol choice, dependency injection strategy)
- A complex multi-phase implementation plan that future sessions may resume
- A rejected alternative worth remembering so future sessions don't re-propose it
- A pattern you established that other code in the project is expected to follow

Do NOT write a design for:

- Routine code changes or bug fixes whose rationale is obvious from the diff
- Session-level context (use `/handoff` instead — handoffs are ephemeral, designs are permanent)
- One-off TODOs or scratch notes

## Before starting an architectural or planning task

Call `design_list` first to surface existing decisions for the current project. If any listed topic is clearly relevant, `design_read` it before proposing new direction — prior rationale often constrains or informs the new work.

## Template

Every design file should follow this structure:

```
# <Topic Title>

_Last updated: <YYYY-MM-DD>_

## Context
Why this decision was needed. What problem it solves.

## Decision
The current chosen approach — one or two paragraphs.

## Alternatives considered
- **<Option A>** — why rejected.
- **<Option B>** — why rejected.

## Consequences
Tradeoffs accepted. What becomes harder. What becomes easier.

## Decision log
Chronological record of how the decision evolved. APPEND to this section on every update — never overwrite or remove entries.

- **<YYYY-MM-DD>** — initial decision: <summary>. Rationale: <...>.
- **<YYYY-MM-DD>** — revised to <new decision>. Reason for change: <...>. Prior decision preserved above.
```

## Updating an existing design

**Critical:** a design file is OVERWRITTEN on every `design_write`. To preserve history:

1. `design_read` the existing file first.
2. Keep every prior "Decision log" entry intact.
3. Append a new "Decision log" entry describing what changed and why.
4. Update "Context", "Decision", "Alternatives considered", and "Consequences" to reflect the current state.
5. `design_write` the full merged document.

Never truncate the Decision log. It is the only history — there are no timestamped backups.

## Topic slugs

Topic names are normalized to kebab-case ASCII (lowercase, hyphens for spaces) and validated against `^[a-z0-9][a-z0-9-]{0,63}$`.

Valid: `auth-flow`, `storage-layout`, `api-versioning`.
Normalized cleanly: `Auth Flow` → `auth-flow`, `StorageLayout` → `storagelayout`.
Rejected: `../evil`, `auth/flow`, leading hyphens, non-ASCII.

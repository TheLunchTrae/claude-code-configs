# Memory (Facts & Instincts)

Memory captures durable per-project facts, preferences, and behavioral rules so future sessions recall them without rediscovery. Entries live at `~/.opencode-artifacts/<project>/memory/<slug>.yaml` and are managed via the `memory_read`, `memory_write`, `memory_list`, and `memory_delete` tools.

Memory is the terse counterpart to designs: designs are multi-paragraph architectural records with history; memory is one-sentence facts and rules with metadata.

## Entry shape

Each entry is a flat YAML document:

- `note` (required) — one short sentence, aim for ≤120 chars. State the fact or rule directly.
- `domain` (optional) — category tag: `git`, `style`, `testing`, `repo-conventions`, etc.
- `trigger` (optional) — condition that activates the entry (e.g. `when committing`, `before running tests`). Presence promotes the entry from plain memory to an **instinct**.
- `confidence` (optional) — 0–1.
- `source` (optional) — `user-told`, `observed`, `repo-curation`.

## When to write a memory entry

Call `memory_write` when:

- The user states a preference the current session won't remember next time.
- A repo convention surfaces that isn't in any rule file and would slow a future session to rediscover.
- A conditional behavioral rule fits a clear trigger — this is an **instinct**.

Do NOT write a memory entry for:

- Session context — use `/handoff` (ephemeral).
- Architectural decisions with rationale or alternatives — use `design_write` (durable but verbose).
- One-off observations whose cost exceeds the value of remembering.

## Terseness is mandatory

`memory_list` output is paid for on every session that calls it. Every extra word in a `note` compounds across sessions. Rules:

- One sentence, aim for ≤120 chars. Hard cap 240.
- No prose, no explanation of rationale, no "the user said …" framing — state the fact directly.
- If the rationale matters, write a design record instead.

## Before starting a task

Call `memory_list` to surface relevant facts and instincts for the current project. Filter by `domain` when the category is known. Use `memory_read` only when the truncated preview in the list is insufficient.

## Instincts vs plain memory

Both shapes share the same directory and tools — `trigger` is the only distinguishing field.

| Shape | Use for | Example |
|-------|---------|---------|
| Plain memory (no `trigger`) | Facts, preferences | note: `User prefers tabs over spaces in all TS files.` |
| Instinct (has `trigger`) | Situational behavioral rules | trigger: `when committing`, note: `Use conventional commit prefixes.` |

## Slugs

Slugs are normalized to kebab-case ASCII and validated against `^[a-z0-9][a-z0-9-]{0,63}$`. Valid: `conventional-commits`, `tabs-preference`. Rejected: `../evil`, `Auth/Flow`, leading hyphens.

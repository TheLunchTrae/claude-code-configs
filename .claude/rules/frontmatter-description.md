# Frontmatter Descriptions

Every config file whose frontmatter schema supports a `description` field must populate it. The router uses `description` to pick the right agent / skill / command automatically — a blank or missing description breaks discovery.

## Applies to

- `agents/*.md` and `opencode/agents/*.md`
- `skills/*/SKILL.md` and `opencode/skills/*/SKILL.md`
- `opencode/commands/*.md` (entries that already carry a frontmatter block)

Document-style files without frontmatter (e.g. `opencode/.opencode/commands/sync-configs.md`) are out of scope — the rule applies only where the frontmatter schema already accepts a `description` key.

## Style

Descriptions are trigger phrases, not marketing. A good description:

- Names the role — "Senior Python developer", "Playwright end-to-end test writer"
- Lists file types, extensions, protocols, or framework aliases where relevant
- Names the 2–3 top capabilities the agent / skill / command brings
- Ends with an explicit "Use for …" or "Use when …" clause so the router has a direct match to fire on

Match the pattern of an existing, well-written description in the same category rather than inventing new structure. Avoid emojis, personas, and adjectives that add no routing signal ("world-class", "expert", "comprehensive").

# Skills

A **skill** is a procedure the AI picks on its own when your request matches it. You don't trigger skills directly — the AI reads each skill's description and fires whichever one fits.

Skills are useful for things you want to happen *consistently every time*, even when you don't remember to ask for them. Example: whenever a task clearly needs planning before code, the `plan` skill fires and the AI produces a plan first instead of diving in.

## When you'll see skills fire

- You describe a non-trivial feature → the `plan` skill fires and a plan shows up before any code.
- You finish a change and ask for a second look → the `review` skill runs a structured review using the report template.
- You make changes in auth / input-handling / crypto code → the `security-review` skill runs the checklist.

If a skill overreaches (fires when you don't want it), just say so — the AI will skip it. You can also trigger the matching slash command (`/plan`, `/review`, `/security-review`) to invoke the same procedure explicitly.

## What's here

| Skill | What it does |
|-------|--------------|
| `plan` | Draft a detailed implementation plan (phases, file paths, risks) before any code is written. Matches the `/plan` command. |
| `review` | Review code and present findings using a standard template. Matches the `/review` / `/code-review` commands. The template lives in `review/template.md`. |
| `security-review` | Security-focused review of current changes or specified files. Matches the `/security-review` command. |

## Commands vs skills

The line blurs. Rough rule:

- **Skill** — something the AI should do automatically when a task fits.
- **Command** — something you type to run the same procedure on demand.

Every skill here has a matching slash command, so you can always force the procedure if the AI doesn't pick it up on its own.

## For config authors

Each skill lives in its own directory under `skills/` with a required `SKILL.md` file. The directory name is the skill ID.

### Frontmatter schema

Authoritative docs: <https://opencode.ai/docs/skills/>.

| Key | Required | Notes |
|-----|----------|-------|
| `name` | yes | Must match the containing directory name. |
| `description` | yes | What the AI reads when deciding whether to invoke this skill. Write a trigger phrase: name the role, list key capabilities, end with "Use for …". |
| `license`, `compatibility`, `metadata` | no | Rarely used. |

**Claude Code keys to strip when porting:** `agent:`, `context:`, `allowed-tools:`, `disable-model-invocation:`. A CC skill with `disable-model-invocation: true` (pure automation, never model-picked) should become an OC *command* instead of an OC skill.

### Adding a new skill

1. Create `skills/<name>/SKILL.md` with `name:` matching the directory name.
2. Write a strong `description` — it's how the AI decides to fire this.
3. Add the `SKILL.md` path (and any companion files like templates) to `opencode/.opencode/sync-configs-manifest.md` under `## Skills`.
4. Add a row to the table above.
5. If you want a manual entry point, create a matching `commands/<name>.md` wrapper.

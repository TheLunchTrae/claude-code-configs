# Skills

Model-invocable procedures. A skill is a directory under `opencode/skills/<name>/` containing a `SKILL.md` file (and any companion files the skill references). The model invokes a skill when its `description` matches the task.

## How OpenCode loads them

1. On session start, OpenCode scans `opencode/skills/*/SKILL.md`.
2. The directory name is the skill ID and must match the `name:` field in frontmatter.
3. The `description` drives model-side selection — write it as a trigger phrase, not marketing.
4. The body is the skill procedure.

OpenCode docs: <https://opencode.ai/docs/skills/>.

## Frontmatter schema

| Key | Required | Notes |
|-----|----------|-------|
| `name` | yes | Must match the containing directory name. |
| `description` | yes | Trigger phrase. Name the role, list file types / protocols / capabilities, end with "Use for …" or "Use when …". |
| `license`, `compatibility`, `metadata` | no | Rarely used; see OpenCode docs. |

**Claude Code-only keys to strip when porting:** `agent:`, `context:`, `allowed-tools:`, `disable-model-invocation:`. CC's `disable-model-invocation: true` skills should become an OC **command** instead of an OC skill.

## Commands vs skills

The lines blur. Current convention in this repo:

- **Skill** — procedure the model chooses to invoke because the description fits.
- **Command** — procedure the user triggers with a slash (`/plan`), usually via a wrapper that sets `agent:` + `subtask: true` and passes the skill.

Several skills here (`plan`, `review`, `security-review`) have matching commands that invoke them.

## Inventory

- `plan/SKILL.md` — create a detailed implementation plan before writing any code. Paired with the `/plan` command.
- `review/SKILL.md` — review code and present findings. Paired with `/review` / `/code-review`. Includes `template.md` (the report template the skill fills in).
- `security-review/SKILL.md` — security review of current changes or specified files. Paired with `/security-review`.

## Adding a new skill

1. Create `opencode/skills/<name>/SKILL.md` with `name:` matching the directory name and a strong trigger-phrase `description`.
2. Add the `SKILL.md` path (and any companion files like `template.md`) to the `## Skills` section of `opencode/.opencode/sync-configs-manifest.md`.
3. Add a bullet to the inventory above.
4. If the skill needs a slash-command entry point, create a wrapper under `opencode/commands/` with `agent:` + `subtask: true` in the frontmatter.

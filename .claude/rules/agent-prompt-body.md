# Agent Prompt Body

Conventions for the markdown body of subagent files in `agents/` and `opencode/agents/`. The frontmatter is covered by `frontmatter-description.md` and `agent-registration.md`; this rule covers everything below the closing `---`.

## Why the body carries the role

Per the [Claude Code subagent docs](https://code.claude.com/docs/en/sub-agents), "the body becomes the system prompt that guides the subagent's behavior. Subagents receive only this system prompt, not the full Claude Code system prompt." The frontmatter `description` is used by the orchestrator to decide when to delegate — the subagent itself never sees its own description at runtime. Anything the subagent needs to know about its role must live in the body.

## Required: role frame

Open the body with a 1-sentence role statement in "You are a..." form. Match the pattern of Anthropic's canonical examples in the subagent docs.

```markdown
You are a senior code reviewer ensuring high standards of code quality and security.
```

Keep it to one sentence. Don't wrap it in an H1 header — the role frame is the opening, not a section.

## Recommended: task context for judgment-heavy agents

For agents where the work is non-mechanical (planning, architecture, review prioritization), follow the role frame with 2-4 sentences describing where the hard calls live and what distinguishes good output from mediocre. Mechanical agents (simplifiers, dead-code cleaners, doc updaters) don't need this — skip it.

```markdown
Review priority is about what matters, not what's most visible. Formatting and naming
nits are easy to spot but rarely worth raising; behavioral bugs and security issues
are subtler and high-value. Assume the author has thought through the obvious things
— focus on what they might have missed.
```

## Worked examples over prose

For format-sensitive guidance (security patterns, framework idioms, query shapes), prefer a short BAD/GOOD code pair over explanatory prose. Examples constrain output format more reliably than descriptions.

Keep each example tight — a handful of lines per side. Skip codebase-specific or narrative examples (full feature plans, ADR templates with made-up technical content); those age poorly and inflate the prompt without commensurate steering value.

## Avoid procedural openers

Don't open the body with a numbered `When invoked: 1. Run X. 2. Run Y. 3. Run Z.` script. Hardcoded step sequences are the "too specific" failure mode from [Anthropic's context-engineering article](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — a model that sees the linter already failed shouldn't blindly run the next three commands before reporting. Express the same intent as a short prose paragraph that names the tools but leaves order to judgment.

````markdown
BAD:
When invoked:
1. Run `git diff -- '*.py'` to see recent Python changes
2. Run `ruff check .` if available
3. Run `mypy .` if available
4. Run `bandit -r .` if available
5. Begin review immediately

GOOD:
Start by understanding what changed (`git diff`). Run any project-configured
linters and type-checkers (`ruff`, `mypy`, `bandit`) before reading the code
yourself — their findings shape what to look for.
````

The narrow exception is high-stakes "stop and ask" gates (security boundaries, destructive-action confirmations) where missing an item is high-cost. Those stay enumerated.

## Checklist sizing

Keep behavioral checklists to ~5 high-signal items per category. Longer enumerated lists are the "laundry list of edge cases" anti-pattern — bullet bloat the model averages over rather than acts on. Compress to canonical pattern names (which are themselves high-signal tokens — "SQL injection", "path traversal", "N+1") plus one BAD/GOOD example per category. Trust the model to extrapolate from the names.

Reviewer and developer agents should carry **at least one** BAD/GOOD worked example per behavioral category — examples are the "pictures worth a thousand words" the article calls out, and they constrain output more reliably than additional bullet points.

Exceptions where exhaustive enumeration earns its tokens: stop-and-ask gates (security boundaries), output-shape templates (codemap structure, plan format), and tool-API surfaces (MCP tool-naming rules) where the explicit text *is* the contract. The `caveman` skill is the in-repo gold standard for worked-example-driven steering.

## Structure after the opening

After role frame + optional task context, the body holds whatever the agent needs: checklists, output formats, severity tables, approval gates. Use Markdown headers to delineate sections. The two shape rules above (avoid procedural openers, keep checklists tight) apply throughout. Match the existing agents for the rest.

## CC and OC bodies must match

Per `config-sync.md`, every CC agent has an OC mirror. The body (everything after the frontmatter) must be identical between `agents/<name>.md` and `opencode/agents/<name>.md`, with one intentional substitution: CC bodies reference `CLAUDE.md`, OC bodies reference `AGENTS.md` (see `.claude/CLAUDE.md` → "Project-conventions file"). Verify parity before committing:

```sh
diff <(sed -n '/^---$/,/^---$/!p' agents/<name>.md) \
     <(sed -n '/^---$/,/^---$/!p' opencode/agents/<name>.md)
```

Expected output is either empty or only the `CLAUDE.md` ↔ `AGENTS.md` line.

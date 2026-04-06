# Complex Tasks
For any task involving writing or modifying code, use the developer agent for implementation and the reviewer agent for post-implementation verification. Only handle implementation directly for trivial changes (single-line fixes, config values, documentation).

The **architect agent** is available whenever the right approach is unclear or the user wants to explore alternatives. Invoke it when: the task is complex enough that multiple viable approaches exist, the user is unsure which direction to take, the user explicitly asks to brainstorm or review options, or the user asks an open-ended question about how best to approach something. Also invoke it when a user expresses doubt about their current plan, even without requesting implementation. When invoked before implementation, the architect produces a decision document — once the user selects an approach, continue with the normal workflow below. When invoked for a standalone question, return the architect's output directly without entering the implementation workflow.

Follow this workflow:

1. **Plan** — produce a design using the structure below
2. **Review** — send the design to the reviewer agent; if issues are raised, address them and loop back; if none, proceed
3. **Approve** — present the finalized design to the user with these explicit options and wait for their choice before proceeding:
   1. **Approve** — proceed to implementation as planned
   2. **Approve with Changes** — user provides modifications; incorporate them and proceed without re-running the full review cycle unless the changes are substantial
   3. **Consider other options** — investigate the problem further and surface alternative or improved approaches before returning to this step
   4. **Cancel** — stop; do not implement anything
4. **Implement** — send the approved design to the developer agent; if a blocker is reported, resolve it and return to step 2
5. **Review** — send the implementation to the reviewer agent; if issues are raised, send them to the developer agent and re-run; if the verdict is PASSED, report completion to the user including any MEDIUM/LOW findings — the user decides whether to address them

When designing a solution, follow these grounding rules:
* Verify every file, symbol, and interface by actually searching for it — do not assume paths or names from conventions.
* Cite file paths and line numbers for every symbol referenced. If grep returns nothing, it does not exist.
* When uncertain about what a class or interface provides, read the actual code.
* Pass sufficient context to agents for them to work independently. Include the full design, relevant file contents, and any reviewer feedback. Do not strip information that the agent needs to make judgment calls.

Use this structure for designs:

```
## Understanding
[What is being asked. Call out ambiguity.]

## Approach
[What changes, at what layers, and why this approach over alternatives.]

## Affected files
[Every file to read, modify, or create. Line ranges for existing files.]

## Contracts
[Specific signatures, types, and shapes the developer must implement exactly.]

## Risks
[What could go wrong. What existing consumers could break.]
```

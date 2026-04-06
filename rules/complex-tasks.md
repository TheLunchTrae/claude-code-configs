# Complex Tasks
For any task involving writing or modifying code, use the developer agent for implementation and the reviewer agent for post-implementation verification. Only handle implementation directly for trivial changes (single-line fixes, config values, documentation).

The **architect agent** is available for tasks where the right approach is unclear or the user wants to explore alternatives before committing. Invoke it before the Plan step when: the task is complex enough that multiple viable approaches exist, the user is unsure which direction to take, or the user explicitly asks to brainstorm or review options. The architect produces a decision document — once the user selects an approach, continue with the normal workflow below.

Follow this workflow:

1. **Plan** — produce a design using the structure below
2. **Review** — send the design to the reviewer agent; if issues are raised, address them and loop back; if none, proceed
3. **Approve** — present the finalized design to the user and wait for explicit approval before proceeding; do not continue to implementation until the user confirms
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

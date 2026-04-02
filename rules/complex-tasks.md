# Complex Tasks
For any task involving writing or modifying code, use the developer agent for implementation and the reviewer agent for post-implementation verification. Only handle implementation directly for trivial changes (single-line fixes, config values, documentation).

Follow this workflow:

1. **Plan** — produce a design using the structure below
2. **Review** — send the design to the reviewer agent; if issues are raised, address them and loop back; if none, proceed
3. **Implement** — send the approved design to the developer agent; if a blocker is reported, resolve it and return to step 2
4. **Review** — send the implementation to the reviewer agent; if issues are raised, send them to the developer agent and re-run; if none, report completion

When designing a solution, follow these grounding rules:
* Verify every file, symbol, and interface by actually searching for it — do not assume paths or names from conventions.
* Cite file paths and line numbers for every symbol referenced. If grep returns nothing, it does not exist.
* When uncertain about what a class or interface provides, read the actual code.
* Pass context to agents verbatim — do not summarize or filter when delegating.

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

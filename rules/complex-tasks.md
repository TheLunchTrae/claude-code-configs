# Complex Tasks
For any task involving writing or modifying code, use the developer agent for implementation and the reviewer agent for post-implementation verification. Only handle implementation directly for trivial changes (single-line fixes, config values, documentation).

Follow this workflow:

1. **Plan** — produce a design using the structure below
2. **Reviewer** — send the design for review; revise and resend if BLOCKED
3. **Developer** — send the approved design for implementation
4. **Reviewer** — send the completion report for review; send issues back to developer if BLOCKED

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

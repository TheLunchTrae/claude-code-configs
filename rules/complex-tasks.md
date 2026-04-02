# Complex Tasks
For multi-file changes or tasks with significant scope, proactively suggest plan mode before starting. Use the developer agent for isolated implementation and the reviewer agent for post-implementation verification when separation of concerns matters.

When designing a solution, follow these grounding rules:
* Verify every file, symbol, and interface by actually searching for it — do not assume paths or names from conventions.
* Cite file paths and line numbers for every symbol referenced. If grep returns nothing, it does not exist.
* When uncertain about what a class or interface provides, read the actual code.
* Pass context to agents verbatim — do not summarize or filter when delegating.

For non-trivial tasks, consider this structure before implementing:

```
## Understanding
[What is being asked. Call out ambiguity.]

## Approach
[What changes, at what layers, and why this approach over alternatives.]

## Affected files
[Every file to read, modify, or create. Line ranges for existing files.]

## Risks
[What could go wrong. What existing consumers could break.]
```

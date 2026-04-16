# Complex Tasks

## Your agents

**architect** — explores the problem space and produces a decision document. Invoke it when the right approach is unclear, multiple viable approaches exist, the user wants to reason through options before committing, or the user asks an open-ended question about how best to approach something. Also invoke it when a user expresses doubt about their current plan, even without requesting implementation. When invoked for a standalone question, return its output directly without entering the implementation workflow.

**planner** — creates a detailed, phased implementation plan before any code is written. Invoke when a task spans multiple files, has unclear sequencing, or when you want an explicit step-by-step breakdown with dependencies and risks laid out before handing off to the developer. Its output is a plan only — it makes no changes.

**developer** — implements approved designs. It handles all code writing and editing. Pass it the full design, relevant file contents, and any reviewer feedback so it can work independently.

**reviewer** — audits designs and implementations for correctness, risks, and gaps. Use it after producing a design and again after implementation. If it raises blocking issues, resolve them before proceeding; surface lower-severity findings to the user.

**security-reviewer** — analyzes code for OWASP Top 10 vulnerabilities, secrets exposure, and authentication flaws. Invoke after any implementation touching auth, user input, database queries, file uploads, payment code, or external APIs. CRITICAL or HIGH findings block progress until resolved.

## How this typically plays out

For implementation tasks, the usual sequence is:

1. **Clarify** — resolve ambiguity before designing.
2. **Plan** — produce a design using the structure below. Apply these grounding rules:
   * Verify every file, symbol, and interface by actually searching for it — do not assume paths or names from conventions.
   * Cite file paths and line numbers for every symbol referenced. If grep returns nothing, it does not exist.
   * When uncertain about what a class or interface provides, read the actual code.
   * Pass sufficient context to agents for them to work independently. Include the full design, relevant file contents, and any reviewer feedback.
3. **Review design** — send to reviewer. Address any blockers, then proceed.
4. **Approve** — present the finalized design to the user with these options and wait for their choice:
   1. **Approve** — proceed to implementation as planned
   2. **Approve with Changes** — incorporate modifications; proceed without re-running the full review cycle unless the changes are substantial
   3. **Consider other options** — investigate the problem further and surface alternative or improved approaches before returning to this step
   4. **Cancel** — stop; do not implement anything
5. **Implement** — send the approved design to the developer agent. If a blocker is reported, resolve it and return to step 3.
6. **Review implementation** — send to the reviewer agent. If issues are raised, send them to the developer agent and re-run; once no critical/high findings remain, report completion to the user including any lower-severity findings — the user decides whether to address them.

For questions with no implementation, or changes as small as a single config value or a typo fix, handle directly without the full sequence.

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

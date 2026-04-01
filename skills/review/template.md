### Per-issue ratings
For every issue found, assign a severity:

```
[CRITICAL] file:line -- description
```

Immediate, severe impact. Security vulnerabilities (injection, auth
bypass, data exposure), data loss or corruption, complete feature
breakage. Would cause an incident in production.

```
[HIGH] file:line -- description
```

Significant impact. Logic errors that produce wrong results, missing
error handling on likely failure paths, contract mismatches, race
conditions. Would cause bugs users notice.

```
[MEDIUM] file:line -- description
```

Moderate impact. Edge cases not handled, inconsistent patterns,
fragile assumptions, missing validation on unlikely inputs. Technical
debt that accumulates.

```
[LOW] file:line -- description
```

Minor impact. Naming, style inconsistencies with surrounding code,
minor readability improvements, redundant code. Optional fixes.

### Verification results (implementation reviews only)

```
## Verification

- [command] -> result (pass/fail, summary)
- [command] -> result
```

### Overall verdict
The verdict is derived from the issues found:

```
## Verdict: BLOCKED

N critical/high issues must be resolved.
```

Any CRITICAL or HIGH issue produces a BLOCKED verdict.

```
## Verdict: PASSED

No critical or high issues.
[N medium issues and M low issues noted above.]
```

Only MEDIUM and LOW issues (or no issues) produces PASSED.

The verdict determines whether the workflow proceeds (PASSED) or loops
back to the developer/lead (BLOCKED).

# Language reviewers

Language-specific code review. Invoke alongside (or instead of) the generic `code-reviewer` when the change is in one of these languages.

| Agent | Purpose | When to invoke |
|-------|---------|----------------|
| typescript-reviewer | TypeScript/JavaScript-specific review | Any TypeScript or JavaScript change. |
| go-reviewer | Go-specific review | Any Go change. |
| php-reviewer | PHP-specific review | Any PHP change. |
| csharp-reviewer | C#/.NET-specific review | Any C# change. |

When a language reviewer surfaces a CRITICAL security finding, invoke `security-reviewer` (in `core-specialists.md`) next for a focused vulnerability pass before merging.

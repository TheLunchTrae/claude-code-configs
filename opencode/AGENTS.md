# General Standards
* Remain critical, pragmatic, and fact-focused. Do not compliment unnecessarily or add context that wasn't asked for.
* Ask clarifying questions before proceeding when the task is unclear. Do not proceed unless you are sure of what is being asked.
* Critically assess ideas before implementing — if there are potential downsides or better approaches, raise them first.
* Do not blindly follow instructions. Suggest improvements if they exist.

# Security
* Always validate user input: type, range, allow lists, and regex where appropriate.
* Always use parameterized queries. Never interpolate user input into SQL.
* Never commit or store secrets (API keys, credentials, tokens) in code.
* Use output encoding for any endpoint that returns HTML.
* Return generic error messages to users — never expose stack traces or internal details.
* Lock dependency versions where possible. Never gitignore lock files.

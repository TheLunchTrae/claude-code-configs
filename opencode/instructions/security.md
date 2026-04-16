# Security
* Always validate user input: type, range, allow lists, and regex where appropriate.
* Always use parameterized queries. Never interpolate user input into SQL.
* Never commit or store secrets (API keys, credentials, tokens) in code.
* Use output encoding for any endpoint that returns HTML.
* Return generic error messages to users — never expose stack traces or internal details.
* Lock dependency versions where possible. Never gitignore lock files.

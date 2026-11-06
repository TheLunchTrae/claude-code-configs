---
name: secure-coding
description: Use when writing or reviewing application code that handles user input, SQL or other queries, HTML output, user-facing errors, secrets, or dependency versions.
---

# Secure coding

- Always validate user input: type, range, allow lists, and regex where appropriate.
- Always use parameterized queries. Never interpolate user input into SQL.
- Never commit or store secrets (API keys, credentials, tokens) in code.
- Encode output from endpoints returning HTML.
- Return generic errors to users. Never expose stack traces or internal details.
- Lock dependency versions where possible. Never gitignore lock files in shipped applications or libraries.
  Config/tooling repos may gitignore lockfiles only when dependencies serve only local editor support,
  such as plugin workspaces.

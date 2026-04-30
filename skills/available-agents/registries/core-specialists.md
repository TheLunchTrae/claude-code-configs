# Core specialists

Language-agnostic specialists. Invoke regardless of the project's primary language.

| Agent | Purpose | When to invoke |
|-------|---------|----------------|
| architect | System design and tradeoffs | Multiple viable approaches, user is unsure, or open-ended design questions. Can run before the workflow to produce a decision document. |
| planner | Implementation planning | Complex features, multi-step refactoring, or new architecture that needs phases, dependencies, and risks laid out before coding. |
| code-reviewer | Generic quality, security, and maintainability review | After every design and every implementation. Delegates language-specific concerns to a language-reviewer. |
| security-reviewer | Vulnerability detection | Auth, user input, DB queries, crypto, API endpoints, file I/O, or anything handling sensitive data. |
| code-simplifier | Simplify existing code | Clarifying or consolidating code without changing behavior. |
| refactor-cleaner | Dead code, unused export, and dependency cleanup | Unused exports or imports, duplicate logic, stale dependencies, or leftover scaffolding. |
| doc-updater | Documentation and codemaps | Public API changes, README drift, or docstring gaps. |
| mcp-builder | MCP server development | Building Model Context Protocol servers — tools, resources, prompts, transports. |

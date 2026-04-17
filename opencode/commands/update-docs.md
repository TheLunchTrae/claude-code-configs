---
description: Update documentation to reflect code changes
agent: doc-updater
subtask: true
---

Keep documentation synchronized with code changes.

Process: identify modified files via `git diff --name-only` → locate relevant docs →
update to reflect implementation changes → verify accuracy.

Scope:
- README: setup steps, capabilities summary, configuration options
- API docs: endpoint descriptions, request/response formats, error codes
- Code comments: function docs, complex logic explanations
- Guides: how-to content, design rationale, troubleshooting

Standards: keep content current and accurate; use plain language; include working
examples; handle edge cases. Documentation should be updated alongside code, not
as an afterthought.

$ARGUMENTS

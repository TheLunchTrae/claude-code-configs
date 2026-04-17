# Common Patterns

## Architectural Memory

Architectural decisions and complex implementation plans are persisted as design records at `~/.opencode-artifacts/<project>/designs/`. Before starting a planning or architectural task, call `design_list` to surface prior decisions. See `instructions/designs.md` for when to write, read, and update them.

## Repository Pattern

Encapsulate data access behind a consistent interface (`findAll`, `findById`, `create`, `update`, `delete`). Business logic depends on the interface, not the storage mechanism — enables swapping sources and simplifies mocking in tests.

## API Response Envelope

Use a consistent envelope for all API responses:
- Status indicator (success/error)
- Data payload (nullable on error)
- Error message (nullable on success)
- Pagination metadata when applicable (total, page, limit)

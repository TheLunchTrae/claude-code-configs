# Common Patterns

## Repository Pattern

Encapsulate data access behind a consistent interface (`findAll`, `findById`, `create`, `update`, `delete`). Business logic depends on the interface, not the storage mechanism — enables swapping sources and simplifies mocking in tests.

## API Response Envelope

Use a consistent envelope for all API responses:
- Status indicator (success/error)
- Data payload (nullable on error)
- Error message (nullable on success)
- Pagination metadata when applicable (total, page, limit)

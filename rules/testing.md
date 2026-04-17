# Testing Requirements

## Coverage

Minimum 80%. Unit tests for individual functions, utilities, components. Integration tests for API endpoints and database operations.

## TDD

Write the failing test first, then the minimal implementation to pass, then refactor. Verify coverage at the end.

## Structure

Use Arrange-Act-Assert. Name tests by the behavior under test, not the function called:

```
test('returns empty array when no markets match query', () => {})
test('throws error when API key is missing', () => {})
test('falls back to substring search when Redis is unavailable', () => {})
```

When a test fails, check isolation and mocks first; fix the implementation, not the test, unless the test is wrong.

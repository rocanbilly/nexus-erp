# Greptile Rules

Custom rules for AI code review. Add these to the Greptile dashboard under **Settings → Custom Rules**, or include in `greptile.json` under `customContext.rules`.

> **Format**: Plain English rules. Greptile interprets and enforces them contextually.
> **Scope**: Use glob patterns to target specific files (e.g., `["src/**/*.ts"]`).

---

## Architecture & Design Patterns

### API & Service Layer
- Controllers should not directly import database models — use services instead
- API endpoints must follow RESTful naming conventions (nouns, not verbs)
- GraphQL resolvers should delegate business logic to service classes
- Use consistent error response formats across all API endpoints (envelope pattern)
- Domain logic must not depend on external frameworks or libraries (clean architecture)
- Use the repository pattern for all database access

### Component Architecture
- React components should use TypeScript interfaces for props, not inline types
- Components over 200 lines should be split into smaller, focused components
- Business logic should not live in UI components — extract to hooks or services
- State management should be centralized, not scattered across components

### Dependency Rules
- No circular imports between modules
- Prefer composition over inheritance
- New dependencies must be justified in PR description — explain why this library over alternatives

---

## Code Quality

### Functions & Methods
- Functions should have a single responsibility (do one thing well)
- Functions should not exceed 50 lines — split if longer
- Maximum 4 parameters per function — use options object for more
- Async functions must include proper error handling with try-catch blocks
- Avoid nested callbacks — use async/await instead
- Public methods must have corresponding unit tests

### Error Handling
- Never use bare `except:` or `catch {}` — always catch specific exceptions
- Error messages should be actionable — tell the user what to do, not just what failed
- Log errors with context (request ID, user ID, operation) for debugging
- Don't swallow errors silently — log or rethrow

### Naming & Readability
- Use meaningful variable and function names (no single-letter variables except loop counters)
- No magic numbers — use named constants
- Boolean variables should be prefixed with is/has/can/should
- Function names should be verbs, class names should be nouns

---

## TypeScript/JavaScript Best Practices

### Type Safety
- Avoid `any` type — use specific types or `unknown` with type guards
- Always define return types for functions
- Use `const` by default, `let` only when reassignment is needed, never `var`
- Prefer `interface` over `type` for object shapes (better error messages)

### Modern Patterns
- Use strict equality (`===`) instead of loose equality (`==`)
- Prefer async/await over Promise chains for readability
- Use optional chaining (`?.`) and nullish coalescing (`??`) over manual checks
- Handle promise rejections explicitly — no unhandled promises
- Use destructuring for cleaner code

### React/Frontend
- Use functional components with hooks, not class components
- Memoize expensive computations with `useMemo`/`useCallback`
- Avoid inline function definitions in JSX (creates new reference each render)
- Extract reusable logic into custom hooks

---

## Python Best Practices

### Type Hints & Documentation
- Include type hints for all function parameters and return values
- Use Google-style docstrings for public functions
- Use `dataclasses` or `pydantic` for data containers

### Modern Python
- Prefer f-strings over string concatenation or `.format()`
- Use list comprehensions instead of loops where appropriate (but keep readable)
- Use context managers (`with`) for resource management
- Handle exceptions with specific exception types, not bare `except`
- Use `pathlib` over `os.path` for file operations

### Code Organization
- Follow PEP 8 style guidelines for naming conventions
- One class per file for large classes
- Keep imports organized: stdlib, third-party, local (use isort)

---

## Go Best Practices

- Handle errors explicitly — don't ignore them with `_`
- Use meaningful variable names — avoid single-letter variables except in short scopes
- Use interfaces for abstraction and testing
- Prefer composition over embedding
- Use context for cancellation, timeouts, and request-scoped values
- Initialize struct fields explicitly
- Return early to reduce nesting

---

## Documentation

### Required Documentation
- All public APIs must have docstrings/JSDoc explaining purpose, parameters, and return values
- Complex algorithms must include comments explaining the approach
- TODO comments must include a ticket number: `TODO(PROJ-123): description`
- No commented-out code blocks — delete or use version control

### PR Requirements
- PR descriptions must explain what AND why
- Breaking changes must be clearly documented
- Changes over 400 lines should be flagged for splitting

---

## Performance

### Database
- Database queries should use parameterized statements, never string formatting
- Database connections must be properly closed or use connection pooling
- N+1 query patterns should be flagged — use eager loading
- Add indexes for frequently queried columns

### Memory & Resources
- Memory-intensive operations should include cleanup
- Cache frequently accessed data appropriately
- Close file handles, network connections, and other resources
- Use streaming for large file operations

### Async Operations
- All API requests should include timeout handling
- Long-running operations should be cancellable
- Use debouncing/throttling for user input handlers

---

## Testing

- Unit tests should test one thing per test
- Test names should describe the expected behavior
- Mock external dependencies, don't hit real APIs in tests
- Include edge cases: null, empty, boundary values
- Async tests must properly await or handle promises

---

## What NOT to Flag

Configure Greptile to suppress (handled by linters):
- Formatting issues (Prettier/Black/gofmt)
- Import ordering (isort/eslint-plugin-import)
- Trailing whitespace
- Line length (configure in linter)
- Semicolon usage (Prettier handles this)

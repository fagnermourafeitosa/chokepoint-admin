# Coding Style

Apply these rules when writing or reviewing Go code.

## Formatting

Always use `gofmt`.

Do not manually align or format code against `gofmt`.

Use `goimports` when available for import management.

## Naming

Prefer short names whose meaning is obvious from scope.

Good:

```go
ctx
cfg
req
resp
repo
user
```

Avoid verbose names copied from Java-style conventions:

```go
userRepositoryImplementation
configurationManager
httpRequestObject
```

Package names should be short, lowercase, and normally singular.

Avoid stuttering:

```go
user.Service
http.Client
config.Config
```

Avoid:

```go
user.UserService
http.HTTPClient
```

Export identifiers only when they are part of the package API.

## Functions

Keep functions focused.

Prefer early returns.

Prefer:

```go
if err != nil {
    return err
}

if user == nil {
    return ErrNotFound
}

return process(user)
```

over unnecessary nesting.

Do not extract a function merely to reduce line count.

Extract when the new function represents a meaningful responsibility or
concept.

Avoid boolean parameters when they make calls ambiguous:

```go
process(user, true, false)
```

Prefer explicit options, separate operations, or typed configuration.

## Types

Prefer useful zero values when practical.

Use pointer receivers when:

* methods mutate the receiver;
* copying the value is undesirable;
* the type contains synchronization primitives;
* pointer semantics are otherwise required.

Keep receiver naming short and consistent:

```go
func (s *Service) Start()
```

## Interfaces

Do not create interfaces preemptively.

Define interfaces where they are consumed.

Keep them small.

Prefer:

```go
type Store interface {
    Get(ctx context.Context, id string) (User, error)
}
```

Do not create `ServiceInterface`, `RepositoryInterface`, or interfaces merely
to mirror every concrete type.

Return concrete types by default.

Accept interfaces where substitutability is actually needed.

## Context

Use `context.Context` for request-scoped cancellation, deadlines, and
operations that may block or perform I/O.

Pass it as the first parameter:

```go
func Load(ctx context.Context, id string) error
```

Do not store request contexts in long-lived structs.

Do not pass `nil` context.

Do not replace an incoming context with `context.Background()` inside the call
chain.

## Generics

Follow `references/generics.md` for comprehensive guidelines on generic functions and type parameters.

* Write concrete implementations first; refactor to generics only upon genuine multi-type repetition.
* Use interfaces when only calling methods on a type; use generics for containers, algorithms on slices/maps, and typed results.
* Prefer standard library packages (`slices`, `maps`, `cmp`, `iter`) over custom generic helpers.
* Prefer concrete code when it is easier to understand and maintain.

## Comments

Comments should explain intent, constraints, invariants, or non-obvious
decisions.

Do not narrate obvious code.

Bad:

```go
// Increment counter.
counter++
```

Document exported APIs when the documentation adds useful meaning.

## Dependencies

Prefer explicit constructor injection:

```go
func NewService(repo Repository, logger *slog.Logger) *Service
```

Avoid hidden global dependencies.

Do not introduce dependency-injection frameworks unless dependency graph or
lifecycle complexity justifies them.
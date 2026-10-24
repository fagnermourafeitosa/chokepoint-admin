# Generics & Generic Functions Best Practices (Go 1.27)

Apply these guidelines when designing, writing, or reviewing code using Go generics, type parameters, and generic functions.

---

## 1. Core Philosophy: Concrete First, Generic Second

1. **Start Concrete**: Write functions and data structures for a specific, concrete type first.
2. **Refactor on Genuine Repetition**: Introduce type parameters only when you find yourself writing identical logic across multiple types and concrete types or interfaces cannot express it cleanly.
3. **Readability Over Cleverness**: If a generic implementation is harder to understand, maintain, or debug than two small concrete functions, prefer the concrete functions.

---

## 2. When to Use Generics

### A. Functions Operating on Slices, Maps, or Channels
When the logic executes identical operations regardless of element type:

```go
func Filter[T any](s []T, keep func(T) bool) []T {
    var out []T
    for _, v := range s {
        if keep(v) {
            out = append(out, v)
        }
    }
    return out
}
```

*Prefer the standard library*: Check `slices`, `maps`, and `cmp` before writing custom generic slice/map utilities.

### B. Type-Safe Containers and Data Structures
When implementing generic data structures (queues, stacks, concurrent caches, set registries):

```go
type Set[T comparable] struct {
    elements map[T]struct{}
}

func NewSet[T comparable]() *Set[T] {
    return &Set[T]{elements: make(map[T]struct{})}
}
```

### C. Generalized Result and Channel Types
When encapsulating asynchronous outcomes or pipeline messages without losing type safety:

```go
type Result[T any] struct {
    Value T
    Err   error
}

func ExecuteAsync[T any](ctx context.Context, fn func(context.Context) (T, error)) <-chan Result[T] {
    ch := make(chan Result[T], 1)
    go func() {
        defer close(ch)
        val, err := fn(ctx)
        ch <- Result[T]{Value: val, Err: err}
    }()
    return ch
}
```

---

## 3. When NOT to Use Generics

### A. Simple Method Invocation (Use Interfaces Instead)
If the function only needs to call a method on a parameter, use a standard Go interface:

```go
// BAD: Unnecessary type parameter
func WriteData[T io.Writer](w T, data []byte) error {
    _, err := w.Write(data)
    return err
}

// GOOD: Idiomatic interface
func WriteData(w io.Writer, data []byte) error {
    _, err := w.Write(data)
    return err
}
```

### B. Calling Different Implementations of Business Logic
Generics are for **identical code operating on different types**, not for polymorphic behavior dispatch. Use interfaces for polymorphism.

### C. Speculative Framework Building
Do not create complex generic repository hierarchies, generic DAOs, or generic CRUD handlers. They add unnecessary indirection and obfuscate domain logic.

---

## 4. Constraints Best Practices

1. **Use Built-in Constraints First**:
   - `any`: When any type is allowed without restrictions.
   - `comparable`: When values must support equality operators (`==`, `!=`), especially as map keys.
   - `cmp.Ordered`: From package `cmp` for types supporting `<`, `<=`, `>`, `>=`.

2. **Narrowest Possible Constraint**:
   - Do not require `comparable` if the function does not perform equality comparison.
   - Use type approximations (`~int`, `~string`) when supporting custom defined types based on primitives.

```go
type Number interface {
    ~int | ~int64 | ~float64
}
```

---

## 5. Generic Functions and Context Propagation

Generic functions that perform I/O, network operations, or transformations must honor Go cancellation and error idioms:

```go
func MapWithContext[T, U any](
    ctx context.Context,
    items []T,
    transform func(context.Context, T) (U, error),
) ([]U, error) {
    out := make([]U, len(items))
    for i, item := range items {
        if err := ctx.Err(); err != nil {
            return nil, err
        }
        res, err := transform(ctx, item)
        if err != nil {
            return nil, err
        }
        out[i] = res
    }
    return out, nil
}
```

---

## 6. Standard Library Integration (Go 1.23+)

Take advantage of standard library packages rather than custom generic implementations:
- `slices`: `slices.Contains`, `slices.Index`, `slices.Clone`, `slices.SortFunc`.
- `maps`: `maps.Keys`, `maps.Values`, `maps.Clone`, `maps.Equal`.
- `cmp`: `cmp.Compare`, `cmp.Or`.
- `iter`: Standard iterator sequences `iter.Seq[V]` and `iter.Seq2[K, V]` for range-over-func patterns.

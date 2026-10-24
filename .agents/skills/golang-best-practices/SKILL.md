---

name: golang-best-practices
description: Apply Go 1.27.0 best practices when creating, modifying, reviewing, refactoring, or testing Go code. Use for Go project structure, package design, generic functions, APIs, errors, concurrency, testing, dependency management, and production code quality.

---

# Go 1.27.0 Best Practices

Use this skill when working on Go source code targeting Go 1.27.0.

## Workflow

1. Inspect the existing project before changing code:

   * `go.mod`
   * package structure
   * existing conventions
   * tests
   * lint/static-analysis configuration

2. Preserve existing project conventions unless they conflict with correctness,
   Go idioms, or an explicit user requirement.

3. Prefer the simplest idiomatic Go solution.

4. Do not introduce unnecessary:

   * abstractions
   * interfaces
   * dependency injection frameworks
   * package layers
   * goroutines
   * speculative generic abstractions
   * third-party dependencies

5. Keep compatibility with Go 1.27.0.
   Do not use APIs or language features not supported in Go 1.27.

6. After changes, run the relevant verification when available:

```bash
gofmt -w .
go vet ./...
go test ./...
```

For concurrency-sensitive changes, also use:

```bash
go test -race ./...
```

## Reference routing

Read only the references relevant to the current task:

* Read `references/coding-style.md` when writing or reviewing Go code.
* Read `references/generics.md` when designing, implementing, or reviewing generic functions, type parameters, constraints, or container types.
* Read `references/errors.md` when designing or reviewing error handling.
* Read `references/concurrency.md` when using goroutines, channels, mutexes,
  atomics, contexts, or concurrent tests.

Load multiple references only when the task actually crosses those concerns.

## General rules

Prefer standard-library solutions when they are sufficient (e.g., `slices`, `maps`, `cmp`, `iter`, `log/slog`).

Prefer explicit dependencies and constructor injection over hidden global state.

Define interfaces at the point of consumption when abstraction is actually needed.

Keep interfaces small.

Return concrete types by default.

Use generic functions and type parameters only when logic is identical across multiple types or for type-safe containers/results. Do not use generics when interfaces or concrete types suffice.

Propagate `context.Context` through operations that perform I/O or can block.

Wrap errors with useful context and preserve their identity with `%w` when callers may inspect them.

Use `errors.Is` and `errors.As`; never branch on error strings.

Keep package APIs minimal.

Do not export identifiers without a reason.

Avoid generic catch-all packages such as `utils`, `helpers`, `common`, and `misc`.

Do not reorganize an existing project merely to conform to a preferred directory layout.

Do not perform speculative refactoring unrelated to the requested change.

## Completion criteria

Before considering a Go change complete:

* code is formatted (`go fmt`);
* code compiles;
* relevant tests pass;
* `go vet` has no new issues;
* concurrency changes are race-checked when practical (`go test -race`);
* no unnecessary dependency or abstraction was introduced;
* generic functions adhere to Go 1.27 best practices (readability, simplicity, type safety);
* behavior remains compatible with Go 1.27.0.

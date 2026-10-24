---
name: golang-echo-framework
description: Guidelines and patterns for building HTTP services using Echo v5 (v5.3.1) in Go 1.25.0, focusing on transport boundaries, context propagation, handler responsibilities, and graceful lifecycle.
---

# Echo v5 (v5.3.1) Framework Guidelines

Use this skill when developing, refactoring, or reviewing HTTP transport layers built with Echo v5.3.1.

## 1. Technology Baseline

* **Go**: `1.25.0`
* **Echo**: `github.com/labstack/echo/v5 v5.3.1`
* Import path: `"github.com/labstack/echo/v5"`
* Middleware path: `"github.com/labstack/echo/v5/middleware"`

## 2. Echo Boundaries

Echo is strictly a transport-layer framework. It must not leak into domain, integration, or business logic.

* **Never propagate `*echo.Context`** into core domain behavior, services, or storage logic.
* **Context extraction**: Extract the request-scoped context at the HTTP boundary:
  ```go
  ctx := c.Request().Context()
  ```
* Pass `ctx` (standard `context.Context`) and explicit Go values/DTOs to downstream layers.

## 3. Handler Responsibilities

Echo handlers should remain lean and focused exclusively on transport concerns:

1. **Parse transport input**: Extract URL parameters, query strings, headers, or JSON body.
2. **Validate transport data**: Check structural correctness and transport constraints.
3. **Invoke application/domain behavior**: Call internal use cases or components with `context.Context`.
4. **Translate errors**: Map domain errors to semantic HTTP status codes.
5. **Produce HTTP response**: Render JSON, text, or status codes.

## 4. Server Lifecycle & Graceful Shutdown

Echo v5 provides `echo.StartConfig` for idiomatic graceful shutdown bound to a parent context:

```go
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()

sc := echo.StartConfig{
    Address:         addr,
    GracefulTimeout: 10 * time.Second,
}

if err := sc.Start(ctx, server); err != nil && !errors.Is(err, http.ErrServerClosed) {
    log.Fatalf("server error: %v", err)
}
```

## 5. Middleware Conventions

Middleware in Echo v5 follows the `echo.MiddlewareFunc` signature:

```go
func CustomMiddleware() echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c *echo.Context) error {
            // Pre-processing
            err := next(c)
            // Post-processing
            return err
        }
    }
}
```

Use built-in middleware from `github.com/labstack/echo/v5/middleware` (such as `Recover()`) alongside project observability middleware.

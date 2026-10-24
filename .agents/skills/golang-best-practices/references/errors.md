# Error Handling

Treat errors as part of the API.

Handle errors explicitly.

## Add context

Add useful context when propagating errors:

```go
user, err := repo.Find(ctx, id)
if err != nil {
    return User{}, fmt.Errorf("find user %q: %w", id, err)
}
```

Use `%w` when callers may need to inspect the underlying error.

Do not wrap errors repeatedly without adding information.

## Inspect errors correctly

Use:

```go
errors.Is(err, ErrNotFound)
```

and:

```go
var target *ValidationError
if errors.As(err, &target) {
    // ...
}
```

Never make program decisions from error strings.

Bad:

```go
if err.Error() == "not found" {
```

## Sentinel errors

Use sentinel errors only for stable conditions callers need to identify.

```go
var ErrNotFound = errors.New("not found")
```

Do not define sentinel errors for every failure.

## Typed errors

Use custom error types when callers need structured information.

Do not create elaborate error class hierarchies.

## Logging

Do not log an error at every layer.

Usually:

```text
lower layer -> add context -> return
boundary -> decide response/log
```

Avoid:

```text
repository logs error
service logs same error
handler logs same error
```

Log where enough context exists to make an operational decision.

## Panic

Do not use panic for expected failures.

Return errors for runtime conditions such as:

* unavailable dependencies;
* invalid input;
* missing data;
* network failures;
* database failures.

Panic may be appropriate for programmer errors or impossible initialization
states where continuing is invalid.

## Cleanup errors

Do not blindly discard cleanup errors when they can affect correctness.

For write operations, closing or flushing may itself report failure.

## Error messages

Error messages should be concise and add context.

Prefer lowercase error text unless it contains a proper noun.

Avoid punctuation when the error will normally be wrapped into a larger
message.

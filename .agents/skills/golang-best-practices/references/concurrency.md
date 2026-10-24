
# Concurrency

Concurrency must solve a concrete problem.

Do not start goroutines simply because Go supports them.

## Goroutine ownership

Every goroutine must have:

* an owner;
* a reason to exist;
* a termination condition;
* defined cancellation behavior.

Avoid fire-and-forget goroutines with unbounded lifetime.

## Context cancellation

Long-running concurrent work should normally observe context cancellation.

```go
select {
case <-ctx.Done():
    return ctx.Err()
case item := <-jobs:
    return process(item)
}
```

Do not create `context.Background()` to bypass cancellation from a caller.

## WaitGroup

For Go 1.25, prefer `sync.WaitGroup.Go` for straightforward groups of
goroutines:

```go
var wg sync.WaitGroup

wg.Go(func() {
    work()
})

wg.Go(func() {
    otherWork()
})

wg.Wait()
```

Do not call `panic` from a function passed to `WaitGroup.Go`.

Use explicit `Add`/`Done` when the lifecycle cannot be represented cleanly by
`WaitGroup.Go`.

## Channels

Use channels when communication or synchronization is the natural model.

Do not use channels merely to avoid a mutex.

The sender/producer side should normally own closing the channel.

Do not close a channel from a receiver unless ownership explicitly belongs to
that receiver.

Do not close a channel just to free resources.

A closed channel communicates that no more values will be sent.

## Buffering

Use buffered channels only when capacity represents an intentional concurrency
or backpressure decision.

Do not add a large arbitrary buffer to hide blocking.

## Shared state

Use `sync.Mutex` or `sync.RWMutex` for shared mutable state when this produces
the simplest design.

Do not replace simple mutex-protected state with complicated channel protocols.

Use atomics only when their semantics are appropriate and clearer than
locking, or when measurement justifies them.

Never copy a mutex or synchronization object after first use.

## Backpressure

Bound concurrent work when input can grow independently of processing
capacity.

Avoid unbounded:

* goroutine creation;
* queues;
* channel buffers;
* retries.

Use worker limits, semaphores, or other explicit bounds where needed.

## Race detection

Run:

```bash
go test -race ./...
```

for concurrency-sensitive changes when the target platform supports it.

Passing normal tests does not prove absence of data races.

## Concurrent tests

Go 1.25 provides `testing/synctest`.

Use it when testing behavior involving:

* goroutines;
* timers;
* sleeps;
* blocking;
* synchronization.

Prefer deterministic synchronization to real sleeps.

Avoid:

```go
time.Sleep(500 * time.Millisecond)
```

as a synchronization strategy in tests.

Do not use concurrency unless it improves the actual workload characteristics
or simplifies the model.
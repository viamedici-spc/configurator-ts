---
status: living
---

# Discussion points

What is still **undecided** about this library. This is the central list; no other document keeps its own. Work that
is decided and not done is [todo.md](todo.md); an idea for later is [backlog.md](backlog.md); a gate held by a
dependency is [upstream-watch.md](upstream-watch.md).

**Lifecycle of a point:** it is added under a category, discussed, and on resolution the decision goes into an ADR where
it is hard to reverse, the state documents are updated, and the point moves to *Resolved* with a link.

**Only what may be public:** a point that cannot be stated without internal detail is kept by the maintainers outside
the repository ([documentation.md](conventions/documentation.md#this-repository-is-public)).

> Format: `- [ ] **Question** (YYYY-MM-DD) — one or two sentences of context; the fallback if it stays open.`
> Resolved: `- [x] **Question** → answer, link (YYYY-MM-DD).`

## <Category>

- [ ] **<Question>** (YYYY-MM-DD) — <context>. **Fallback:** <what stays in place meanwhile>.

## Resolved

- [x] **<Question>** → <answer>, [ADR NNNN](adr/NNNN-topic.md) (YYYY-MM-DD).

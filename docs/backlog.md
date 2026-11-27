---
status: living
---

# Backlog

Ideas with no commitment attached.

- **A GitHub wiki with user-facing guides** (2026-11-26): hands-on tutorials prepared from the feature notes — first
  optimistic decisions, trimming and immutability. The wiki of a public repository is public too.
- **A browser test of `sessionCreateUrl`** (2026-11-26): create a session through a local HTTP/1.1 server in Chrome and
  Firefox, so the gate sees how browsers send the forwarded request. The unit test checks only that the body is
  forwarded as bytes; a browser in the gate is a larger step.

---
status: living
---

# To-do

**Work that is decided and not yet done**, defects included. What is undecided is
[discussion-points.md](discussion-points.md); an idea for later is [backlog.md](backlog.md).

An entry says what to do, what it **waits on**, and how you know it is **done**; the third keeps this from becoming a
wish list. **A finished entry is deleted, not ticked**: the change is the record, and git carries the history.

> Format: `- [ ] **<Title>** (YYYY-MM-DD) — what and why. **Waits on** <nothing | what>. **Done when** <check>.`

## Release

- [ ] **fp-ts-extensions at its release** (2026-11-26) — `package.json` pins the prerelease
  `2.0.0-modern-toolchain-20261126094931`; before merging into `main`, it pins the released 2.0.0. **Waits on** the
  fp-ts-extensions 2.0.0 release. **Done when** `package.json` names `2.0.0` and `bun run verify` passes.

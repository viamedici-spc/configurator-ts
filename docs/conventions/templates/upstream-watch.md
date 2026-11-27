---
status: living
---

# Upstream watch

Things we would do differently if a dependency, a runtime or the engine's public API allowed it, each with the one
command that says whether it does yet.

⚠️ **Nobody polls this file.** It is read at one moment: when somebody upgrades the dependency in question. An entry
here is owed by somebody else, so it can be neither decided nor planned.

**The bar for an entry** is two things together: a concrete thing we would do differently, and a plausible change
upstream that would enable it. **An entry dies** when it is unblocked and acted on, or when we give up the ideal; the
second is a line in an ADR. **Every entry carries a check** and a `Last checked` line. An engine behavior is described
as observed at its public API, never by its internals.

## <Dependency>

### <What we would rather have, as a short statement>

- **We would rather** <the ideal>.
- **We do instead** <the workaround, with the path from the repository root where it lives>.
- **What blocks it:** <what the dependency does not offer yet>.
- **Check** (<what the output means>):

  ```bash
  <one command that answers whether the gate has lifted>
  ```

- **What it would buy:** <what goes away once it lifts>.
- **Upstream:** <public issue or release notes link, or "not reported">.
- **Last checked:** <version>, YYYY-MM-DD: <the result>.

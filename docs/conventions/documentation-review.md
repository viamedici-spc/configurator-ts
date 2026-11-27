---
status: accepted
---

# Documentation review

[Doc Delta](documentation.md#doc-delta-the-everyday-rule) keeps the documents consistent change by change; this review
is the periodic **sweep** that catches what slipped through.

**Scope:** every file the [conventions](documentation.md#scope) govern, checked **against the rest of the set, against
the code and against the public-repository rule**. The code is what makes this a library's review: a README example is
compiled against the current API, TSDoc and feature notes are compared with what the code does, and `overview.md`'s
contract with what the entry point exports.

**The output is ephemeral.** A findings list is worked through and then deleted. What survives is the edits it caused
and any [discussion point](../discussion-points.md) or [to-do](../todo.md) it produced.

## When to run one

- Before a release tag, so the released documentation matches the released code.
- After a burst of work that touched many documents or moved many files.
- Before the documents are handed to a new reader: a new maintainer, an agent starting a large task.

## The procedure

1. **Prepare:** fix the revision under review, read the [discussion points](../discussion-points.md) and the
   [to-dos](../todo.md) first, so a known open point is not reported as a finding, and run `bun run verify`.
2. **Split the set into disjoint scopes and audit each against the others and against the code:** the entry points
   (`README.md`, `AGENTS.md`, `overview.md`); TSDoc on the public API; the feature notes; the ADRs; the lists and the
   conventions; `CHANGELOG_DRAFT.md` against the commits since the last release. The value is in the crossings: every
   cross-reference followed, every fact that appears in two places compared at both ends, every described behavior
   checked in the code that implements it.
3. **Verify, consolidate, rank:** check each finding against the file before writing it down, quote both sides of a
   conflict, drop duplicates, order by the processing order below.

**Finding format:** `[severity] — one-sentence claim — evidence (file, line, short quote; on a conflict both sides) —
the resolution`.

**Severities:** `LEAK` · `CONTRADICTION` · `STALE` · `GAP` · `DUPLICATION` · `NIT`.

**Processing order:** L leaks of non-public material → A contradictions → B decisions or code changes that did not
reach their documents → C bookkeeping (statuses, links) → D genuine gaps, which usually become discussion points →
E cosmetics, batched. ⚠️ **A leak that reached a pushed commit** is reported to the maintainers at once, outside the
findings file; whether the history is rewritten is theirs to decide.

### A parked list is a table of tickable rows

A review that cannot be closed in one pass parks its findings in `docs/review-findings-<date>.md`, with a discussion
point pointing at it. The file is worked through over many commits, so its form serves that work:

- **A header** naming the revision reviewed, the disjoint scopes, how to work the list and the processing order.
- **One table per tier**, with the columns `✔ · ID · Finding · Sites · Resolution`, and a done count above it
  (`**0 of 10 done.**`). A code review run in the same sitting shares the file, with tiers of its own.
- **One row per claim**, consolidated by claim rather than by site: a rule broken in six files is one row with six
  sites, and a finding that bundles several claims is split, so each row can be ticked on its own.
- **A stable ID** per row: the tier's letter, a middle dot, a number (`A·1`). The commit that fixes a row names its ID
  and ticks it: ❗ open, ✅ done, ➖ dissolved, with the reason in the row. The progress reads off the history.
- **An *Already closed* table** for what was fixed while the list was being consolidated, so nobody re-opens it.
- **Every row is a claim, not a fact** ([code-review.md](code-review.md)): it is re-established against the code when
  it is picked up, before anything is changed.

When the last row is ticked, the file goes, and the discussion point that names it moves to *Resolved*.

### The resolution belongs in the finding

The answer is obvious at the moment of finding and much less so a week later, so it is written down then. For a
contradiction between two documents the default is that **the newer side stands**, and the finding names which side is
newer and what makes it so: an ADR's status, an entry in *Resolved*, a commit. If the claim rests on "this is the
current one", the finding shows the history (`git log -L`). Between a document and the code, the code is what runs, so
the document is wrong unless the finding shows the code is the defect. Where neither side is clearly right, the finding
states the fork and the one fact that would decide it, and says that it is a discussion point.

| Fix | When it applies |
|---|---|
| **rewrite the older side** | one side is demonstrably newer, or the code has moved on |
| **remove the claim** | a count, a file list or a promise that will rot again |
| **scope the claim** | true of one part of the API, stated of all of it |
| **move it** | right content in the wrong home: later work to the backlog, a member's contract into its TSDoc |
| **mark it expired** | an ADR whose supporting fact went false: it keeps its text and gains a dated note |
| **none, it dissolves** | one of the two checks below disposes of it |

### Two checks before a finding stands

**Is there a deliberate *no* somewhere else?** A document being silent is not a finding: an ADR's *Alternatives
considered* may record the decision not to do the thing. Only an incompatible assertion is a contradiction.

**A finding is a claim, not a site.** The same wrong sentence is usually in more than one file, often in another SPC
library too; the sweep is over the claim, including after the fix.

## What a library's documents tend to get wrong

- **A leak:** an engine internal, an internal host, a customer's name or an internal finding in a document, a comment,
  a test fixture or a commit message.
- **An example that no longer compiles:** a README or TSDoc example written against an earlier API.
- **Seam drift between the libraries:** a library on top describing the behavior of the one below as it was, or two
  feature notes for one feature restating each other instead of linking.
- **A satellite list:** an "open points" or "to confirm" enumeration inside a state document, duplicating the central
  lists.
- **A list holding the wrong kind of entry:** a question in the to-dos, a task among the questions, a wish in either.
- **A changelog draft out of step:** a user-visible change with no entry, or an entry for something that was reverted.
- **Prose escapes identifier greps:** a rename applied to symbols but not to the prose about them; audit meaning, not
  just strings. And **a count is not an inspection**: grepping how often a stale term appears and accepting the number
  lets a false fact survive. Inspect every occurrence.

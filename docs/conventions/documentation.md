---
status: accepted
---

# Documentation conventions

This document is **authoritative** for how this library's documentation is written and kept. Where in doubt, it wins
over habit or precedent from another repository. The goal: a developer or a coding agent who has never seen the library
loads its context in a few minutes, and the documents stay consistent with the code for as long as the library exists.

The same conventions hold for the four public client libraries of SPC (`fp-ts-extensions`, `configurator-ts`,
`configurator-react`, `configurator-framer`); each repository carries its own copy. A change to the convention is made
in all four, so they do not drift apart.

## Scope

These conventions govern every Markdown file in the repository (`README.md`, `AGENTS.md`, `CHANGELOG_DRAFT.md` and
everything under `docs/`), and the paths that code comments cite ([code.md](code.md#code-comments)). TSDoc on the public
API is documentation too; how it is written is [code.md](code.md#tsdoc-on-the-public-api), what it is for is below.

## This repository is public

**Everything committed here is read by anyone**: on GitHub, in the npm package, through jsDelivr. So documents, lists,
code comments, TSDoc, tests, test fixtures and commit messages describe **only the public API and the behavior a
consumer can observe**. They never contain:

- internals of the Configuration Engine or of any other service: how it works inside, why it behaves as it does,
  its source code, its defects as analysed from the inside;
- internal hosts, internal repositories or their contents, tokens, credentials;
- customer names, customer projects or anything that identifies a customer's configuration models;
- internal findings, analyses, handovers or meeting results.

**What the engine does at its documented REST API is public**; what it does behind it is not. A behavior of the engine
that matters to this library is written as what a request returns, never as why. An engine defect that the library works
around is described by its observable symptom, and the workaround by what it does.

**The tell** is a sentence a consumer could not have learned from the public API, the published documentation or this
repository. Such material stays outside the repository, in the maintainers' internal tracker or notes, and a document
here may say that a question is open without saying more.

**Git history counts as documentation**, and it is the half that cannot be quietly fixed later: a commit message is
public the moment it is pushed. So this is checked **before** pushing. Locally it is still repairable with an `--amend`
or a rewrite of the unpushed range.

## Two kinds of documents

| | **State documents** (living) | **Log documents** (append-only) |
|---|---|---|
| Answer | "What is true **now**?" | "What did we decide, **when and why**?" |
| Examples | `overview.md`, `vision.md`, feature notes, the lists, the conventions | ADRs |
| Maintenance | **overwritten** and kept current | written once, never changed in substance |
| Tense | present | dated |
| History | the git log | the document itself |

A state document never accumulates its own history: no "previously", no "as of", no "since version 3". It describes
the current state; git carries the history, the changelog tells consumers what changed, and the *why* of a decision goes
into an ADR the state document links. The same rule holds for code comments ([code.md](code.md#code-comments)).

## Maturity: a status field, never draft and final files

There are never two files like `x-draft.md` and `x-final.md`. Every file under `docs/` carries its maturity in the
frontmatter and moves through it in place:

```yaml
---
status: draft        # draft → in-review → accepted → superseded
---
```

- **draft:** work in progress, may still change shape entirely.
- **in-review:** believed complete, awaiting the maintainers' sign-off.
- **accepted:** in effect.
- **superseded:** no longer authoritative; a pointer to the successor stands at the top.
- **living:** a document that by nature never reaches a final state: the lists, and conventions that grow.
- **snapshot:** a dated record that asserts nothing about now, with its date in its file name.

ADRs use **proposed**, **accepted**, **rejected** and **superseded**. A `proposed` ADR is a decision written down and
waiting for the maintainers; the discussion point that holds the question links to it.

**There is no `updated:` field.** `git log -1 --format=%ad -- <file>` answers when a file changed, exactly and for free;
a field kept by hand drifts. `README.md`, `AGENTS.md` and `CHANGELOG_DRAFT.md` carry no frontmatter: they are entry
points and working files, not documents under this lifecycle.

## ADRs: correcting one and reversing one are different acts

- **A correction is always made in place:** a stale path, a wrong value, a consequence that contradicts the decision. A
  correction does not change what was decided; it makes the document say what was decided.
- **Until the branch that introduced it is merged into `main`, an ADR is revised in place.** The feature is still being
  developed, and changing a decision is part of that. The position given up goes into *Alternatives considered*, with
  what decided against it.
- **After that, a reversal is append-only:** the old ADR is marked `superseded` and points to its successor, and the new
  decision gets its own number. Its *Alternatives considered* names the overturned position and what overturned it.
- **While a decision is challenged and not yet re-decided**, the ADR's status goes back to `proposed` and the conflict
  is registered in [discussion-points.md](../discussion-points.md).
- **A decision text reads as the decision as it now stands.** Never "an earlier version of this ADR said"; the
  superseded position belongs under *Alternatives considered*, or nowhere if it carries nothing forward.

**Write an ADR** when a decision is hard to reverse, will be questioned later, or has non-obvious consequences: a public
API shape, a supported environment, a dependency the consumer inherits, a behavior that differs from what a consumer
would assume. Everyday, reversible decisions need none. An ADR is short: *Context*, *Decision*, *Consequences*,
*Alternatives considered*. The heading is `# ADR NNNN: <the decision>` with a `Date:` line below it, the file is
`docs/adr/NNNN-<topic>.md`. The file name names the topic and stays stable once anything links it; the heading states
the decision as it stands, so the two may drift apart by design. Numbering is the repository's own, from 0001.

## Directory structure

Folders and files exist once they hold content; no empty placeholders. The target picture:

```
/
├── README.md                     # for users: what the library is, install, a first example, links onward
├── AGENTS.md                     # for coding agents: the rules in short, the documentation map
├── CHANGELOG_DRAFT.md            # entries for the next release, per conventions/changelog.md
└── docs/
    ├── overview.md               # purpose, public contract, invariants, architecture, environments, commands
    ├── vision.md                 # goals, non-goals, audiences, place among the SPC libraries
    ├── features/<feature>.md     # one note per feature whose behavior needs more than TSDoc
    ├── adr/NNNN-<topic>.md       # architecture decision records
    ├── discussion-points.md      # what is undecided
    ├── todo.md                   # what is decided and not done
    ├── backlog.md                # what comes later, with no commitment
    ├── upstream-watch.md         # what we would do differently if a dependency allowed it
    └── conventions/
        ├── documentation.md      # this document
        ├── documentation-review.md  # the periodic consistency sweep
        ├── code.md               # code conventions, TSDoc, the verification gate
        ├── code-review.md        # how a received code review is worked through
        ├── changelog.md          # how release notes are written
        └── templates/            # skeletons for each document above
```

The skeleton is the target picture, not a closed list. A document that belongs to no folder joins `docs/` itself.

## Where what goes

| Question a reader has | Where the answer lives |
|---|---|
| How do I install it and get a first result? | `README.md` |
| What does this function, type or property do, what are its defaults and pitfalls? | TSDoc on the member |
| How does a behavior spanning several members work, with its edge cases and flow? | `docs/features/<feature>.md` |
| What is the library, what does it promise, what does it run in? | `docs/overview.md` |
| What is it for, and what is it deliberately not for? | `docs/vision.md` |
| Why is it built this way? | `docs/adr/` |
| What changed for me in the next release? | `CHANGELOG_DRAFT.md`, then the release notes |
| What is open, decided-but-not-done, later, or waiting on a dependency? | the four lists |

**One fact, one home.** TSDoc is authoritative for a single member, so a feature note names the member and links nothing
it would have to restate; the README shows a path through the API and leaves the contract to TSDoc and `overview.md`.

## The individual documents

- **`README.md`:** user-facing. What the library is in a paragraph, installation (bundler and jsDelivr), a first
  example that compiles against the current API, and links to the documentation. It never carries contract detail that
  TSDoc or `overview.md` owns.
- **`overview.md`:** the living entry, with a fixed spine: *Purpose* (including what is out of scope) · *Public
  contract* (the entry point and what it exports, by name and link) · *Invariants* · *Architecture* · *Supported
  environments* · *Commands* · *Links*. It names and links; the detail lives in TSDoc, feature notes and ADRs. The spine
  is a minimum: further sections may follow *Commands* where the library has substance the spine has no slot for. **No
  "to change X, edit these files" section:** it rots with the first refactor while the prose still reads as true; its
  durable half is an invariant.
- **`vision.md`:** goals, **non-goals**, the audiences, and where the library sits among the SPC libraries.
- **`features/<feature>.md`:** only for a feature whose flow or edge cases need more than TSDoc. *Goal* · *User-visible
  behavior* · *Edge cases / rules* · *Flow* · *Tests that define behavior* · *Links*. It describes the feature as it is:
  no rollout or migration notes, which belong in the changelog, and no list of follow-ups, which belong in the lists.
  **A feature that spans libraries** has one note per library, each describing what that library adds and linking the
  lower layer's note instead of restating it.
- **`discussion-points.md`:** the **central** list of what is undecided. No other document keeps a parallel list. A
  state document that needs to show what it still has open does so in **one sentence** that names the entries by title
  and links here, never a list of them, which would drift from the real one. On resolution: an ADR where the decision is
  hard to reverse, the state document updated, the point moved to *Resolved* with a link and the date.
- **`todo.md`:** work that is **decided and not yet done**, defects included. An entry says what to do, what it **waits
  on**, and how you know it is **done**; the third keeps the list from becoming a wish list. A finished entry is
  deleted, not ticked: the change is the record. **The tell** that something is on the wrong list is having to write
  "decided, not open" into a discussion point.
- **`backlog.md`:** ideas with no commitment attached. An entry says "later", not "next"; it becomes a discussion point
  or a to-do when its time comes.
- **`upstream-watch.md`:** what we would do differently if a dependency, a runtime or the engine's public API allowed
  it. An entry is owed by somebody else, so it can be neither decided nor planned, and it is read when somebody upgrades
  that dependency, not when planning. **The bar** is two things together: a concrete thing we would do differently, and
  a plausible upstream change that would enable it. **Every entry carries a runnable check and a `Last checked` line.**
  An entry dies when it is unblocked and acted on, or when we give up the ideal; the second is a line in an ADR, because
  "we stopped wanting this" is a decision.
- **`CHANGELOG_DRAFT.md`:** collects the entries for the next release, in the form
  [changelog.md](changelog.md) prescribes, written for application developers. It is updated in the same commit as the
  change it describes. The maintainers write the final release notes from it; after a release it starts empty again.
- **A `TODO` comment in code** marks a defect at the place it sits. Work that spans files, or that someone has to
  decide, goes to `todo.md` or `discussion-points.md` instead, where it is seen.

The lists' formats are in their own headers. A skeleton for every document is in `docs/conventions/templates/`.

## Doc Delta: the everyday rule

Every substantive change ends with reconciling the documents it affects, **in the same commit**:

1. **Public API changed?** TSDoc on every touched member, the README's examples if they use it, `overview.md` if the
   contract or an invariant moved, and an entry in `CHANGELOG_DRAFT.md`.
2. **A behavior a consumer can observe changed?** The feature note that describes it, and the changelog entry.
3. **A decision that is hard to reverse?** An ADR.
4. **A supported environment, a command or the toolchain changed?** `overview.md` and `AGENTS.md`.
5. **A point opened or resolved?** [discussion-points.md](../discussion-points.md). **Decided, not done?**
   [todo.md](../todo.md). **Later?** [backlog.md](../backlog.md).
6. **Worked around something a dependency cannot do yet?** An entry in [upstream-watch.md](../upstream-watch.md), with
   its check. The workaround still gets its comment where it lives; the entry makes it findable at upgrade time.
7. **A decision or a mechanism borrowed from elsewhere?** Recorded as below.

There is no bookkeeping step: git records when. The periodic sweep that catches what slipped through is
[documentation-review.md](documentation-review.md).

## Recording a borrowed decision

The SPC libraries and other projects share a stack, so they keep meeting the same questions, and taking over an answer
that was reached well elsewhere is legitimate. What makes it legitimate rather than sloppy is that **the reasoning
comes with it**, written as our own: in the ADR or the state document it applies to, say what was decided, the
**constraint it rests on**, and what was deliberately not taken. The constraint is what a later reader checks: an
answer whose constraint no longer holds is the failure mode.

**The source is not named**: not in a document, a comment, a test or a commit message. A pattern and its reasoning
cross over; another project's name and product detail never do. The tell of a transplant written badly is a decision
whose reasoning is thinner than everything around it, because it was lifted rather than derived.

## No personal data

**No document, comment, test or commit message names a person.** Roles stand in for people: "the maintainers", "the
reviewer", "a consumer". Test data uses invented values, never a real person's or a real customer's. A closed
repository might allow an exception for its own team; a public one does not.

## Conventions in detail

- **English**, American spelling, in every document, code comment and commit message.
- **File and folder names** are kebab-case. **Paths are stable**; a file is renamed only when its name has become
  misleading, because a rename breaks every inbound link.
- **Cross-references are relative Markdown links**, checked against the file and the heading. A link to another SPC
  library's document is an absolute GitHub URL to its `main` branch.
- **A code path in a document is a code span written from the repository root:** `src/contract/Types.ts`, never with a
  run of `../`.
- **Dates are ISO 8601**, `2026-11-26`. A state document carries a date only where it is load-bearing, such as a dated
  observation of something external.
- **Wrap prose at 120 columns.** The wrapping is deliberate.
- **Do not explain a thing by contrasting it with a sibling document.** "Unlike the hooks note…" asserts what another
  document says and breaks when it changes. A link upward, to a rule this document inherits, is safe.
- **Do not count things in prose** unless the number is the argument. "The four hooks" drifts the moment a fifth exists.
- **Domain terms are the platform's**, the same in every SPC library: *configuration model*, *session*, *attribute*,
  *decision* (explicit, implicit, fixed), *consequence*, *explain*. A library on top uses the term of the library below
  unchanged rather than coining its own.

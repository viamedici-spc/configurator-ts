---
status: accepted
---

# Working through a received code review

**The counterpart to [documentation-review.md](documentation-review.md)**, and the direction is the difference: that one
is a sweep *we* run over our own documents, this one is what to do with a findings list somebody hands us. Every rule
below is here because skipping it has cost something.

**This binds agents in particular.** A findings list is exactly the shape a model is most eager to act on directly: each
entry names a file, a line and a fix, so the work reads as already decided. It is not, and the next section is why.

## A finding is a claim about the code, not a fact about it

A good review is far more reliable about *something is wrong here* than about *this is what is wrong*. Findings come
back already fixed, describing a mechanism the code does not have, or latent rather than live. Nothing is fabricated;
the reviewer was reading without running. Dismissing a finding because its mechanism is wrong is the opposite mistake,
and just as expensive.

**So every finding is re-established against the code before anything is planned around it**, and the verdict is one
of four:

| | |
|---|---|
| **holds** | the account is accurate |
| **holds-differently** | something is broken; the mechanism, the site or the consequence is not what the review says |
| **already-fixed** | a later commit closed it |
| **does-not-hold** | the reviewer misread |

⚠️ **`holds-differently` is the common answer and the one that changes the work**, because the fix follows from the
mechanism. **Line numbers move**: a review is written against a revision, and earlier batches move code out from under
the later findings. Re-locate rather than trust.

## Look for the second site

A defect is usually repeated by the code written in the same stretch of work: the same shape in a sibling hook, the
mirror image in the same function, the same mapping in the other direction. A reviewer reading a diff sees the
instance rather than the pattern. **A second site of the same defect belongs to that finding** and is fixed with it; a
*new* finding of the same family does not (see the scope below). Across the SPC libraries, a defect in how one layer
uses the layer below is worth checking in the other layers that use it the same way.

## The order: the gate first

**Fix what makes findings checkable before fixing findings**: a test the gate never runs, a check that passes either
way, a type check that does not reach the tests. Then anything that breaks the public-repository rule
([documentation.md](documentation.md#this-repository-is-public)), then a defect in the public contract, then behavior,
then everything else.

## The scope is the maintainers', and the sweep is recorded

Verification grows the list: second sites, and further findings of the same shapes found by sweeping the same files.
**Presenting that as one pile and starting work is the failure mode.** The cut is a judgement about risk and time that
belongs to the maintainers, so it is put to them explicitly, with the options costed. What is out of scope is
**written down** as one [todo.md](../todo.md) entry naming the findings, never silently folded in or silently dropped.

## One session establishes, another implements

Re-establishing a finding and implementing it can run in two sessions at the same time. The **review session** takes
the findings one at a time with the maintainers: the verdict against the code, the second site, and the change agreed
concretely (what changes where, what is left alone, how it is checked). Only an agreed finding goes to the
**implementing session**, as a brief that stands on its own: the ID, the verdict, the change, the check. The
implementing session implements, runs the gate, commits per batch and reports back.

- **The implementing session does not re-decide.** Where the code does not match the brief, it stops on that finding
  and reports back instead of improvising.
- **One writer per branch.** Only the implementing session changes the branch; the review session reads it, so its
  verdicts are made against what is committed.
- **Its report is checked, not taken.** The review session reads each finished commit as a second reader before the
  finding counts as done.

Writing the brief is a test of its own: a finding that cannot be put down as a concrete change is not ready.

## Every fix is falsified against the unfixed code

**Run the new test before the fix and record what it said.** A test written after the fix tends to pass either way: an
assertion a value satisfies regardless, a fake that already carries the fix, a path where the invariant held anyway.

⚠️ **A fake written after the fix asserts the fake.** When a contract between two parts changes, the contract goes into
the declaration an implementer reads (the type, its TSDoc), and the fake follows it rather than standing in for it.

## The fix is a change, so review the change

**A fix is written under the reviewer's framing**, the narrowest possible view of the code, and fixes introduce defects
of their own. So the finished work gets an adversarial pass with lenses that are not the finding's: the public contract
and its TSDoc, a value's or a subscription's whole lifetime, what a consumer on the layer above will now see, and
whether the new tests discriminate.

## Two suites catch different things, and neither substitutes

A unit suite with fakes and a suite against the real engine fail on different defects: the fake encodes what we believe
the engine does. **When a fix concerns the engine's behavior, ask what the fake cannot produce**, and cover that against
the engine where a test can reach it.

## Measure a claim about somebody else's software, and about your own

**Recall is not evidence, and neither is a reviewer's paraphrase.** A claim about what the engine, a browser, React or
a dependency does is checked against the running thing, through its public interface, before a fix is built on it.

**A *cannot* is a claim like any other.** *This state is unreachable*, *the hook never re-renders here*: an
impossibility is answered only by trying to produce the thing. **Before a run is allowed to confirm anything, say what
the counterexample would look like and whether this run could see it.** A measurement that cannot fail is not one.
Prefer recording the measurement over recording the conclusion, so the next reader sees what was observed.

## Closing out

- **Where the review lives:** in the repository only if every finding passes the public-repository rule, as a parked
  list in the form [documentation-review.md](documentation-review.md#a-parked-list-is-a-table-of-tickable-rows)
  describes; otherwise outside it, with the maintainers. Either way, a commit cites the finding by its ID, and its
  message carries no more of the finding than the rule allows.
- **One commit per batch**, whose message carries the falsification output. That is where a reader learns the test
  could fail.
- **What the batch did not cover is stated in the same commit**, not left to be inferred from an absence.
- **Doc Delta as everywhere else** ([documentation.md](documentation.md#doc-delta-the-everyday-rule)): a fix that
  changes public behavior updates TSDoc, the feature note and `CHANGELOG_DRAFT.md`. Where the code disagreed with a
  document that was already right, nothing needs writing, and that is worth checking before writing it.

## Links

- [documentation-review.md](documentation-review.md): the sweep we run over our own documents
- [code.md](code.md): the conventions a fix has to satisfy, and what `verify` means
- [todo.md](../todo.md): where a deferred finding goes

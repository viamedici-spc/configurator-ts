# Fixed Decisions

## Goal

Let an API consumer create a Configuration Session with **fixed decisions** — decisions passed once when the
session is created that are **permanent and immutable** for the lifetime of that session. They cannot be changed
or removed and never need to be resent on later requests; to use a different set, create a new session. The
library handles this automatically.

Fixed decisions express **system decisions** rather than user choices. Typical use case: a model that branches on
a context such as the sales region — depending on the region, different constraints apply. The configurator passes
the correct region as a fixed decision when opening the session, activating the matching constraints for the whole
session.

**Why not just an explicit decision?** Previously the context was sent as an ordinary explicit (user) decision.
When it caused a blockage, the engine's *explain* could offer to resolve or undo it — which must not happen for a
system-imposed context. Fixed decisions are respected by explain: they are treated as immutable and are never
offered as part of a solution set.

## User-visible behavior

- New optional field on `SessionContext`:
  ```ts
  readonly fixedDecisions?: ReadonlyArray<FixedDecision> | null;
  ```
- Provide a flat list of fixed decisions when creating the session:
  ```ts
  const session = await SessionFactory.createSession({
      apiBaseUrl: config.hcaEngineEndpoint,
      sessionInitialisationOptions: { accessToken: config.accessToken },
      configurationModelSource: {
          type: ConfigurationModelSourceType.Channel,
          channel: "release",
          deploymentName: "car-configurator"
      },
      fixedDecisions: [
          {
              type: AttributeType.Choice,
              attributeId: { localId: "SalesRegion" },
              choiceValueId: "EU",
              state: ChoiceValueDecisionState.Included
          }
      ]
  });
  ```
- The engine constrains the model to the fixed decisions and **trims** it: values determined by a fixed decision
  are reported in the consequences as immutable (`isPossibleDecisionStatesImmutable === true`), and now-impossible
  states are removed from `possibleDecisionStates`.
- To change the fixed decisions, **create a new session** — they are not mutable within a session.

## Edge cases / rules

- **Concrete state required.** A `FixedDecision` has a strict, non-nullable state (unlike `ExplicitDecision`,
  where `null`/`undefined` means "reset"): choice/component are `Included` | `Excluded`, numeric carries a
  `number`, boolean a `boolean`. The domain types enforce this at compile time.
- **Empty ⇒ omit.** No fixed decisions → leave `fixedDecisions` out (or `undefined`); the library sends nothing.
- **Surfaces as an *Implicit* decision.** A fixed value appears with `decision.kind === DecisionKind.Implicit`.
  A consumer may still send the *matching* explicit decision (it becomes `Explicit`), and clearing that explicit
  decision (reset) falls back to the implicit fixed value. A *contradicting* explicit decision conflicts.
- **Unsatisfiable / invalid ⇒ session creation fails.** If the fixed decisions cannot be satisfied (or reference
  something that does not exist, or contradict each other), `SessionFactory.createSession` rejects with a
  `FixedDecisionsInvalid` error.

## Flow (sequence)

1. Consumer builds a `SessionContext` with `fixedDecisions` and calls `SessionFactory.createSession`.
2. `mapSessionContext` (`src/domain/mapper/DomainToEngineMapping.ts`) maps the domain list to the engine
   `FixedDecision[]` and puts it on the `CreateSessionRequest`.
3. The engine applies the fixed decisions as constraints, trims the model, and returns consequences with the
   affected values marked immutable.
4. On invalid fixed decisions the engine returns `FixedDecisionsInvalid` (HTTP 409); the client maps it
   (`EngineToDomainMapping.ts` → `mapToFixedDecisions` for `rejectedDecisions`) and the create promise rejects.

## Tests that define behavior

`tests/area/contract/ConfigurationSession.test.ts` (real engine):
- **Trimming on/off** — with a fixed `Choice1 = Value2 Included` the value is immutable and trimmed to
  `[Included]`; without it the value stays interactive with both states.
- **Invalid ⇒ error** — an invalid fixed decision rejects session creation with `FixedDecisionsInvalid`
  (carrying `rejectedDecisions` + `validationMessage`).
- **Implicit ↔ Explicit round-trip** — a fixed decision is `Implicit`; a matching `makeDecision` turns it
  `Explicit`; resetting it (`undefined`) falls back to `Implicit`.

## Rollout / migration notes

- Additive and backward compatible: `fixedDecisions` is optional; existing sessions are unaffected.
- Replaces the previous client-side workaround of sending a system context as an ordinary explicit decision (which
  explain could offer to undo). Move such contexts to `fixedDecisions` so explain treats them as immutable.
- Consumes the latest Configuration Engine OpenAPI contract (the `FixedDecision[]` create-session field and the
  `FixedDecisionsInvalid` problem type).

## Links

- Contract types: `src/contract/Types.ts` (`SessionContext.fixedDecisions`, `FixedDecision`), errors in
  `src/contract/ConfiguratorError.ts`, equality in `src/contract/Eqs.ts`.
- Mapping: `src/domain/mapper/DomainToEngineMapping.ts` (`mapFixedDecisions`),
  `src/domain/mapper/EngineToDomainMapping.ts` (`mapToFixedDecisions`, `mapConfiguratorError`).

import * as Engine from "./EngineLogic";
import * as Storing from "./ConfigurationStoring";
import * as OD from "./OptimisticDecisions";
import {pipe, TE} from "@viamedici-spc/fp-ts-extensions";
import {asLeftUnit, asUnit, createStateMutatingWorkItem, createStatePreservingWorkItem, guardSession} from "./WorkItem";
import {ConfigurationSessionState} from "../model/ConfigurationSessionState";

export const makeDecision = pipe(
    Engine.makeDecision,
    guardSession,
    asUnit,
    asLeftUnit,
    f => createStateMutatingWorkItem(f, OD.makeDecision, true),
);
export const setMany = pipe(
    Engine.setMany,
    guardSession,
    asLeftUnit,
    f => createStateMutatingWorkItem(f, OD.setMany, true),
);
export const setSessionContext = pipe(
    Engine.setSessionContext,
    asUnit,
    f => createStateMutatingWorkItem(f, null, false),
);
export const reinitialize = pipe(
    () => Engine.reinitialize,
    asUnit,
    f => createStateMutatingWorkItem(f, null, false),
);
export const explain = pipe(
    Engine.explain,
    guardSession,
    createStatePreservingWorkItem
);
export const storeConfiguration = pipe(
    () => (sessionState: ConfigurationSessionState) => TE.right(Storing.storeConfiguration(sessionState.configurationRawData)),
    createStatePreservingWorkItem
);
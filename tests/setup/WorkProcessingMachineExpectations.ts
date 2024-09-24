import {createWorkProcessingMachine} from "../../src/domain/WorkProcessingMachine";
import {WorkItem} from "../../src/domain/model/WorkItem";
import {expect} from "vitest";

type SutType = ReturnType<typeof createWorkProcessingMachine>;
type SutSnapshotType = ReturnType<SutType["getSnapshot"]>;

function expectWorkInOrder(snapshot: SutSnapshotType): (workOrder: ReadonlyArray<WorkItem<any>>) => void {
    return workOrder => {
        expect(snapshot.context.work).toHaveLength(workOrder.length);
        workOrder.forEach((work, index) => {
            expect(snapshot.context.work[index]).toBe(work);
        });
    };
}

function expectWorkToRun(snapshot: SutSnapshotType): (workToRun: ReadonlyArray<string>, matchExact: boolean) => void {
    return (workToRun, matchExact) => {
        if (matchExact) {
            expect(snapshot.context.runningWork).toHaveLength(workToRun.length);
        }
        workToRun.forEach(work => {
            expect(snapshot.context.runningWork.get(work)).toBeTruthy();
        });
    };
}

function expectWorkToBeExecuted(snapshot: SutSnapshotType): (workItemId: string, executionAmount: number|undefined) => void {
    return (workItemId, executionAmount) => {
        expect(snapshot.context.workExecutionAttemptAmount.get(workItemId)).toBe(executionAmount);
    };
}

function expectState(snapshot: SutSnapshotType): (...args: Parameters<SutSnapshotType["matches"]>) => void {
    return (...args) => {
        expect(snapshot.matches(...args)).toBeTruthy();
    };
}

function prepare(sut: SutType): <T extends ReadonlyArray<unknown>, R>(fn: (snapshot: SutSnapshotType) => (...args: T) => R) => (...args: T) => R {
    return fn => (...args) => fn(sut.getSnapshot())(...args);
}


export default function getWorkProcessingMachineExpectations(sut: SutType) {
    const prep = prepare(sut);
    return {
        expectWorkInOrder: prep(expectWorkInOrder),
        expectState: prep(expectState),
        expectWorkToRun: prep(expectWorkToRun),
        expectWorkToBeExecuted: prep(expectWorkToBeExecuted),
    };
}
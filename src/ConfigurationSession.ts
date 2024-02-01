import {constVoid, flow, O, pipe, T, TE} from "@viamedici-spc/fp-ts-extensions";
import {IContractToDomainMapper} from "./mappers/ContractToDomainMapper";
import {IDomainToContractMapper} from "./mappers/DomainToContractMapper";
import IConfigurationSession, {ExplainQuestionParam, OnConfigurationChangedHandler} from "./IConfigurationSession";
import {IConfigurationSessionInternal} from "./domain/IConfigurationSessionInternal";
import {TaskEitherResult} from "./domain/Model";
import {
    Configuration,
    ConstraintsExplainAnswer,
    DecisionsExplainAnswer,
    ExplainAnswer,
    ExplainQuestion,
    ExplainSolution,
    ExplicitDecision,
    FullExplainAnswer,
    SessionContext,
    SetManyMode,
} from "./contract/Types";
import {explainQuestionBuilder, ExplainQuestionBuilder} from "./contract/ExplainQuestionBuilder";

// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
export default class ConfigurationSession implements IConfigurationSession {

    private onConfigurationChangedHandler: O.Option<OnConfigurationChangedHandler>;

    private readonly inner: IConfigurationSessionInternal;
    private readonly contractToDomainMapper: IContractToDomainMapper;
    private readonly domainToContractMapper: IDomainToContractMapper;

    constructor(inner: IConfigurationSessionInternal, contractToDomainMapper: IContractToDomainMapper, domainToContractMapper: IDomainToContractMapper) {
        this.inner = inner;

        this.contractToDomainMapper = contractToDomainMapper;
        this.domainToContractMapper = domainToContractMapper;

        this.onConfigurationChangedHandler = O.none;
    }

    public setOnConfigurationChangedHandler(handler: OnConfigurationChangedHandler): void {
        const handlerInternal = pipe(handler, O.fromNullable, O.map(h => (s) => {
            const configuration = this.domainToContractMapper.mapToConfiguration(s);
            h(configuration);
        }));

        this.inner.setOnConfigurationChangedHandler(handlerInternal);
    }

    public getConfiguration(): Configuration {
        const configuration = this.inner.getConfiguration();
        return this.domainToContractMapper.mapToConfiguration(configuration);
    }

    public getSessionContext(): SessionContext {
        const sessionContext = this.inner.getSessionContext();

        return this.domainToContractMapper.mapToSessionContext(sessionContext);
    }

    /**
     * @throws {FailureResult}
     */
    public async setSessionContext(sessionContext: SessionContext): Promise<void> {
        const domainSessionContext = this.contractToDomainMapper.mapToSessionContext(sessionContext);

        return await pipe(this.inner.setSessionContext(domainSessionContext),
            TE.map(constVoid),
            this.adaptToContractPromise()
        )();
    }

    /**
     * @throws {FailureResult}
     */
    public async restoreConfiguration(configuration: Configuration): Promise<void> {

        const domainState = this.contractToDomainMapper.mapToConfiguration(configuration);

        return await pipe(this.inner.restoreConfiguration(domainState),
            TE.map(constVoid),
            this.adaptToContractPromise()
        )();
    }

    /**
     * @throws {FailureResult}
     */
    public async makeDecision(decision: ExplicitDecision): Promise<void> {

        const domainDecision = this.contractToDomainMapper.mapToAttributeDecision(decision);

        return await pipe(this.inner.makeDecision(domainDecision),
            TE.map(constVoid),
            this.adaptToContractPromise()
        )();
    }

    /**
     * @throws {FailureResult}
     */
    public async setMany(decisions: ReadonlyArray<ExplicitDecision>, mode: SetManyMode): Promise<void> {
        const domainDecisions = this.contractToDomainMapper.mapToAttributeDecisions(decisions);
        const domainMode = this.contractToDomainMapper.mapToMode(mode);

        return await pipe(
            this.inner.setMany(domainDecisions, domainMode),
            TE.map(constVoid),
            this.adaptToContractPromise()
        )();
    }

    /**
     * @throws {FailureResult}
     */
    public async applySolution(solution: ExplainSolution): Promise<void> {
        const domainSolution = this.contractToDomainMapper.mapToSolution(solution);

        return await pipe(this.inner.applySolution(domainSolution),
            TE.map(constVoid),
            this.adaptToContractPromise()
        )();
    }

    /**
     * @throws {FailureResult}
     */
    public explain(question: ExplainQuestionParam, answerType: "decisions"): Promise<DecisionsExplainAnswer>;
    public explain(question: ExplainQuestionParam, answerType: "constraints"): Promise<ConstraintsExplainAnswer>;
    public explain(question: ExplainQuestionParam, answerType: "full"): Promise<FullExplainAnswer>;
    public async explain(question: ExplainQuestionParam, answerType: "decisions" | "constraints" | "full"): Promise<ExplainAnswer> {
        const explainQuestion = typeof question === "function" ? question(explainQuestionBuilder) : question;
        const domainExplainQuestion = this.contractToDomainMapper.mapToExplainQuestion(explainQuestion, answerType);

        return await pipe(
            this.inner.explain(domainExplainQuestion),
            TE.map(explanationResult => this.domainToContractMapper.mapToExplainAnswer(explanationResult)),
            this.adaptToContractPromise()
        )();
    }

    /**
     * @throws {FailureResult}
     */
    public async close(): Promise<void> {

        return await pipe(
            this.inner.close(),
            TE.mapLeft(l => this.domainToContractMapper.mapToFailureResult(l)),
            TE.match(Promise.reject, s => Promise.resolve())
        )();
    }

    private adaptToContractPromise<R>(): (e: TaskEitherResult<R>) => T.Task<Promise<R>> {
        return flow(TE.mapLeft(l => this.domainToContractMapper.mapToFailureResult(l)),
            TE.match(l => Promise.reject(l), r => Promise.resolve(r)));
    }
}
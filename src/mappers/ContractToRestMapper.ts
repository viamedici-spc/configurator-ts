import * as Contract from "../contract/Types";
import * as Engine from "../apiClient/engine/models/generated/Engine";
import {A, flow, O, pipe, RA} from "@viamedici-spc/fp-ts-extensions";
import {match, P} from "ts-pattern";

export interface IContractToRestMapper {

    mapToCreateSessionRequest(sessionContext: Contract.SessionContext): Engine.CreateSessionRequest;
}

export default class ContractToRestMapper implements IContractToRestMapper {
    public mapToCreateSessionRequest(sessionContext: Contract.SessionContext): Engine.CreateSessionRequest {
        return {
            configurationModelSource: this.mapToConfigurationModelSource(sessionContext.configurationModelSource),
            attributeRelations: this.mapToAttributeRelations(sessionContext.attributeRelations),
            usageRuleParameters: this.mapToUsageRuleParameters(sessionContext.usageRuleParameters),
            allowedInExplain: this.mapToAllowedInExplain(sessionContext.allowedInExplain)
        };
    }

    private mapToConfigurationModelSource(configurationModelSource: Contract.ConfigurationModelSource): Engine.ConfigurationModelSource {
        return match(configurationModelSource)
            .with({type: Contract.ConfigurationModelSourceType.Channel}, (v): Engine.ConfigurationModelFromChannel => ({
                type: "Channel",
                deploymentName: v.deploymentName,
                channel: v.channel
            }))
            .with({type: Contract.ConfigurationModelSourceType.Package}, (v): Engine.ConfigurationModelFromPackage => ({
                type: "Package",
                configurationModelPackage: v.configurationModelPackage
            }))
            .exhaustive();
    }

    private mapToAttributeRelations(decisionsToRespect: Contract.AttributeRelations | null | undefined): Engine.DecisionsToRespect[] | null | undefined {
        return pipe(
            decisionsToRespect,
            O.fromNullable,
            O.map(flow(
                RA.map(r => this.mapToDecisionsToRespect(r)),
                r => [...r]
            )),
            O.toUndefined
        );
    }

    private mapToDecisionsToRespect(decisionsToRespect: Contract.DecisionsToRespect): Engine.DecisionsToRespect {
        return {
            attributeId: decisionsToRespect.attributeId,
            decisions: pipe([...decisionsToRespect.decisions], A.map(attributeId => {
                return this.mapToGlobalAttributeId(attributeId);
            }))
        };
    }

    private mapToUsageRuleParameters(usageRuleParameters: Record<string, string> | null | undefined): Record<string, string> | undefined {
        return pipe(O.fromNullable(usageRuleParameters), O.toUndefined);
    }

    private mapToGlobalAttributeId(attributeId: Contract.GlobalAttributeId): Engine.GlobalAttributeId {
        return {
            localId: attributeId.localId,
            componentPath: attributeId.componentPath,
            sharedConfigurationModelId: attributeId.sharedConfigurationModelId
        };
    }

    private mapToAllowedInExplain(allowedInExplain: Contract.AllowedInExplain | null | undefined): Engine.AllowedInExplain {
        return match(allowedInExplain)
            .with({
                rules: {
                    type: Contract.AllowedRulesInExplainType.none
                }
            }, (v): Engine.AllowedInExplain => ({
                rules: {
                    type: "AllowedRulesNone"
                }
            }))
            .with({
                rules: {
                    type: Contract.AllowedRulesInExplainType.specific,
                    rules: P.array(P.any)
                }
            }, (v): Engine.AllowedInExplain => ({
                rules: {
                    type: "AllowedRulesSpecific",
                    rules: pipe(v.rules.rules, RA.map(x => this.mapToGlobalConstraintId(x)), x => [...x])
                }
            }))
            .otherwise((): Engine.AllowedInExplain => ({
                rules: {
                    type: "AllowedRulesAll"
                }
            }));
    }

    private mapToGlobalConstraintId(constraintId: Contract.GlobalConstraintId): Engine.GlobalConstraintId {
        return {
            localId: constraintId.localId,
            configurationModelId: constraintId.configurationModelId
        };
    }
}
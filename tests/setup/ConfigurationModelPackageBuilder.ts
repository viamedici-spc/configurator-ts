import {match, P} from "ts-pattern";
import {
    BooleanAttribute,
    ChoiceAttribute,
    ChoiceValue,
    ComponentAttribute,
    ComponentInclusionType,
    ConfigurationModel,
    ConfigurationModelPackage,
    Constraint,
    NumericAttribute
} from "../../src/apiClient/engine/models/generated/Engine";

export class ConfigurationModelBuilder {
    private readonly configurationModelId: string;

    private readonly sharedFromConfigurationModels: string[] = [];

    private readonly booleanAttributes: BooleanAttribute[] = [];
    private readonly numericAttributes: NumericAttribute[] = [];
    private readonly choiceAttributes: ChoiceAttribute[] = [];
    private readonly componentAttributes: ComponentAttribute[] = [];
    private readonly constraints: Constraint[] = [];

    constructor(configurationModelId: string) {
        this.configurationModelId = configurationModelId;
    }

    public optionalChoiceAttribute(id: string, values: number | ReadonlyArray<string>): ConfigurationModelBuilder {

        this.choiceAttribute(id, 0, 1, values);
        return this;
    }

    public mandatoryChoiceAttribute(id: string, values: number | ReadonlyArray<string>): ConfigurationModelBuilder {

        this.choiceAttribute(id, 1, 1, values);
        return this;
    }

    public choiceAttribute(id: string, lower: number, upper: number, values: number | ReadonlyArray<string>): ConfigurationModelBuilder {

        const choiceValues = match<number | ReadonlyArray<string>>(values)
            .with(P.number, a => this.createChoiceValues(a))
            .with(P.array(P.string), a => a.map(v => ({choiceValueId: v})))
            .otherwise(() => {
                throw new Error("Values must be either a number or a list of strings");
            });

        this.choiceAttributes.push({
            attributeId: id,
            lowerBound: lower,
            upperBound: upper,
            choiceValues: choiceValues
        });

        return this;
    }

    public integerAttribute(id: string, min: number, max: number, isDecisionRequired?: boolean): ConfigurationModelBuilder {
        return this.numericAttribute(id, min, max, 0, isDecisionRequired);
    }

    public decimalAttribute(id: string, min: number, max: number, decimalPlaces: number, isDecisionRequired?: boolean): ConfigurationModelBuilder {
        return this.numericAttribute(id, min, max, decimalPlaces, isDecisionRequired);
    }

    public booleanAttribute(id: string, isDecisionRequired?: boolean): ConfigurationModelBuilder {
        this.booleanAttributes.push({
            attributeId: id,
            isDecisionRequired: isDecisionRequired ?? true
        });
        return this;
    }

    public constraint(id: string, expression: string): ConfigurationModelBuilder {
        this.constraints.push({constraintId: id, textualConstraint: expression});
        return this;
    }

    public componentAttribute(id: string, configurationModelId: string, componentInclusionType: ComponentInclusionType): ConfigurationModelBuilder {

        this.componentAttributes.push({
            attributeId: id,
            configurationModelId: configurationModelId,
            inclusion: componentInclusionType
        });

        return this;
    }

    public sharedConfigurationModel(configurationModelId: string): ConfigurationModelBuilder {
        this.sharedFromConfigurationModels.push(configurationModelId);

        return this;
    }

    public build(): ConfigurationModel {
        return {
            configurationModelId: this.configurationModelId,
            sharedFromConfigurationModels: this.sharedFromConfigurationModels,
            attributes: {
                booleanAttributes: this.booleanAttributes,
                numericAttributes: this.numericAttributes,
                choiceAttributes: this.choiceAttributes,
                componentAttributes: this.componentAttributes
            },
            constraints: this.constraints
        };
    }

    private numericAttribute(id: string, min: number, max: number, decimalPlaces: number, isDecisionRequired?: boolean): ConfigurationModelBuilder {
        this.numericAttributes.push({
            attributeId: id,
            min: min,
            max: max,
            decimalPlaces: decimalPlaces,
            isDecisionRequired: isDecisionRequired ?? true
        });
        return this;
    }

    private createChoiceValues(count: number): Array<ChoiceValue> {
        return [...Array(count).keys()]
            .map((i) => ({choiceValueId: String.fromCharCode(65 + i)}));
    }
}

export class ConfigurationModelPackageBuilder {
    private configurationModels: ConfigurationModelBuilder[] = [];
    private readonly rootConfigurationModelBuilder: ConfigurationModelBuilder = new ConfigurationModelBuilder("root");

    public rootConfigurationModel(builderFunc: (builder: ConfigurationModelBuilder) => ConfigurationModelBuilder): ConfigurationModelPackageBuilder {
        builderFunc(this.rootConfigurationModelBuilder);

        return this;
    }

    public configurationModel(configurationModelId: string, builderFunc: (builder: ConfigurationModelBuilder) => ConfigurationModelBuilder): ConfigurationModelPackageBuilder {
        const configurationModelBuilder = builderFunc(new ConfigurationModelBuilder(configurationModelId));

        this.configurationModels.push(configurationModelBuilder);

        return this;
    }

    public build(): ConfigurationModelPackage {
        return {
            root: "root",
            configurationModels: [...this.configurationModels.map(m => m.build()), this.rootConfigurationModelBuilder.build()]
        };
    }
}
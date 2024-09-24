import {ConfigurationModelSource, ConfigurationModelSourceType} from "../../src";

export const ModelWithOneMandatoryChoice: ConfigurationModelSource = {
    type: ConfigurationModelSourceType.Package,
    configurationModelPackage: {
        root: "model1",
        configurationModels: [
            {
                configurationModelId: "model1",
                attributes: {
                    choiceAttributes: [{
                        attributeId: "a1",
                        choiceValues: [
                            {choiceValueId: "v1"},
                            {choiceValueId: "v2"},
                        ],
                        lowerBound: 1,
                        upperBound: 1
                    }]
                }
            }
        ]
    }
};
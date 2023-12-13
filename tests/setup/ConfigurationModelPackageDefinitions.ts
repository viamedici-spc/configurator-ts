import {ConfigurationModelPackageBuilder} from "./ConfigurationModelPackageBuilder";

export const externalFrameBackpack = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b
        .mandatoryChoiceAttribute("Color", ["Grey", "Olive", "RAL7013", "TAN"])
        .mandatoryChoiceAttribute("Fabric", ["Cordura0500D", "Cordura0700D", "Nylon0050D", "Nylon0300D", "Nylon0500D", "Nylon1000D"])

        .decimalAttribute("KgPerSqM", 0, 10, 2)
        .booleanAttribute("IsCustom")

        .constraint("ReqRAL7013", "Color.RAL7013 -> (Fabric.Cordura0500D OR Fabric.Cordura0700D)")
        .constraint("ReqTL", "shared::requirement::TL -> Color.RAL7013")
        .constraint("ReqWR", "shared::requirement::WR -> Fabric.Cordura0500D OR Fabric.Cordura0700D OR Fabric.Nylon1000D")
        .constraint("ReqHL", "shared::requirement::HL -> KgPerSqM == 1")
        .constraint("Incompatible", "Color.RAL7013 -> !(Fabric.Nylon0050D OR Fabric.Nylon0300D OR Fabric.Nylon0500D OR Fabric.Nylon1000D)")
        .constraint("ReqFabricForCustom", "IsCustom -> Fabric.Cordura0500D OR Fabric.Cordura0700D")
        .constraint("ReqFabricForWeight", "KgPerSqM > 0.5 -> Fabric.Nylon1000D OR Fabric.Cordura0700D")

        .componentAttribute("LidBuckles", "buckle", {
            type: "OptionallyIncluded", isDecisionRequired: true
        })
        .componentAttribute("AttachmentBuckles", "buckle", {
            type: "OptionallyIncluded", isDecisionRequired: false
        })

        .sharedConfigurationModel("requirement")
    )
    .configurationModel("requirement", b => b
        .booleanAttribute("TL")
        .booleanAttribute("WR")
        .booleanAttribute("HL")
    )
    .configurationModel("buckle", b => b
        .mandatoryChoiceAttribute("material", ["Acetal", "Plastic"])
        .sharedConfigurationModel("requirement")
        .constraint("ReqHL", "shared::requirement::HL -> material.Acetal")
    )
    .build();

export const changeDecisionDemo = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b
        .mandatoryChoiceAttribute("X", ["X1", "X2"])
    ).build();

export const canContributeToDemo = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b
        .optionalChoiceAttribute("X", ["X1", "X2"])
        .optionalChoiceAttribute("Y", ["Y1", "Y2"])
        .constraint("either", "X.* OR Y.*")
    ).build();

export const explainSatisfactionDemo = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b
        .mandatoryChoiceAttribute("A", ["A1", "A2"])
        .optionalChoiceAttribute("X", ["X1", "X2"])
        .optionalChoiceAttribute("Y", ["Y1", "Y2"])
        .constraint("either", "X.* OR Y.*")
    ).build();

export const implicationDemo = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b
        .booleanAttribute("trigger")

        .mandatoryChoiceAttribute("choice", ["v1", "v2"])
        .booleanAttribute("boolean")
        .decimalAttribute("numeric", 0, 10, 0)
        .componentAttribute("component", "m1", {
            type: "OptionallyIncluded",
            isDecisionRequired: true
        })
        .constraint("implicate-all", "trigger -> boolean AND numeric == 3 AND choice.v2 AND component")
    )
    .configurationModel("m1", b => b.booleanAttribute("not-relevant"))
    .build();

export const fancyCar = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b
        .mandatoryChoiceAttribute("Color", ["Red", "Olive"])
    )
    .build();

export const notSolvable = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b
        .mandatoryChoiceAttribute("X", ["X1", "X2"])
        .constraint("problem", "true -> false")
    )
    .build();

export const invalidConstraint = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b
        .mandatoryChoiceAttribute("X", ["X1", "X2"])
        .constraint("requires", "X.X1 -> whoops?!")
    )
    .build();

export const simpleBoolM = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b
        .booleanAttribute("x", true))
    .build();

export const simpleBoolO = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b
        .booleanAttribute("x", false))
    .build();


export const orgModel = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b
        .mandatoryChoiceAttribute("Color", ["Red", "Olive"])
        .integerAttribute("Amount", 0, 10, true)
        .booleanAttribute("Enabled", true)
        .componentAttribute("Sub", "sub", {
            type: "OptionallyIncluded",
            isDecisionRequired: true
        })
    )
    .configurationModel("sub", b => b.choiceAttribute("Color", 1, 1, ["Red", "Olive"]))
    .build();

export const extModel = new ConfigurationModelPackageBuilder()
    .rootConfigurationModel(b => b
        .mandatoryChoiceAttribute("Color", ["Red", "Olive", "Black"])
        .integerAttribute("Amount", 0, 15, false)
        .booleanAttribute("Enabled", false)
        .componentAttribute("Sub", "sub", {
            type: "OptionallyIncluded",
            isDecisionRequired: true
        })
    )
    .configurationModel("sub", b => b.choiceAttribute("Color", 1, 1, ["Red", "Olive", "Black"]))
    .build();
import { createRulesetFunction } from "@stoplight/spectral-core";

export default createRulesetFunction(
    {
        input: null,
        options: {
            type: "object",
            additionalProperties: false,
            properties: {
                "mandatoryProperties": {
                    type: "array", 
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            "name": { type: "string" },
                            "required": { type: "boolean" },
                            "type": { type: "string" },
                        },
                        required: ["name"],
                    }
                },
                "optionalProperties": {
                    type: "array", 
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            "name": { type: "string" },
                            "required": { type: "boolean" },
                            "type": { type: "string" },
                        },
                        required: ["name"],
                    }
                },
                "canHaveOtherProperties": { type: "boolean" },
                "allowAdditionalProperties": { type: "boolean" },
            }
        },
    },
    function checkObjectProperties(input, options, context) {
        if (!input || input.type !== 'object'){
            context.path.push("type");
            return [{ message: 'should be an object' }];
        }

        if (input.properties === undefined){
            return [{ message: 'should be have properties' }];
        }

        options.mandatoryProperties = options.mandatoryProperties || [];
        options.optionalProperties = options.optionalProperties || [];

        //check mandatory properties are all declared
        for (const prop of options.mandatoryProperties) {
            if (!input.properties[prop.name]){
                context.path.push("properties");
                return [{ message: 'should have mandatory property "' + prop.name + '"' }];
            }
        }

        //if not canHaveOtherProperties, check all properties are declared
        if (options.canHaveOtherProperties === false){
            const acceptedProperties = options.mandatoryProperties.map((p) => p.name);
            acceptedProperties.push(...options.optionalProperties.map((p) => p.name));

            for (const prop in input.properties) {
                const propInMandatory = options.mandatoryProperties.find((p) => p.name === prop);
                const propInOptional = options.optionalProperties.find((p) => p.name === prop);
                if (!propInMandatory && !propInOptional){
                    context.path.push("properties");
                    return [{ message: 'should not have property "' + prop + '", only one of [' + acceptedProperties.join(", ") + ']'}];
                }
            }
        }

        //for each input.properties check in option.manadatoryProperties and option.optionalProperties
        //and chekc if type and required is correct
        for (const prop in input.properties) {
            const propInMandatory = options.mandatoryProperties.find((p) => p.name === prop);
            const propInOptional = options.optionalProperties.find((p) => p.name === prop);
            const foundProp = propInMandatory || propInOptional;

            //prop not found
            if(!foundProp){
                 //canHaveOtherProperties
                if (options.canHaveOtherProperties === false){
                    context.path.push("properties");
                    context.path.push(prop);
                    return [{ message: 'should not have property "' + prop + '"' }];
                }else{
                    continue;
                }
            }

            //type
            if (foundProp.type !== undefined && input.properties[prop].type !== foundProp.type){
                context.path.push("properties");
                context.path.push(prop);
                context.path.push("type");
                return [{ message: 'property "' + prop + '" should be of type "' + foundProp.type + '"' }];
            }

            //required
            if (foundProp.required === true && (!input.required || !input.required.includes(prop))){
                context.path.push("required");
                return [{ message: 'property "' + prop + '" should be required' }];
            }
            if (foundProp.required === false && (input.required && input.required.includes(prop))){
                context.path.push("required");
                return [{ message: 'property "' + prop + '" should not be required' }];
            }
        }

        //allowAdditionalProperties
        if(options.allowAdditionalProperties === false){
            if (input.additionalProperties === undefined || input.additionalProperties !== false)
                return [{ message: 'should not allow additional properties' }];
        }
    }
);

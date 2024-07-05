import Ajv from "ajv"; //ajv is built-in spectral
import { createRulesetFunction } from "@stoplight/spectral-core";

export default createRulesetFunction(
    {
        input: null,
        options: {
            type: "object",
            additionalProperties: false,
            properties: {
                example: { type: "object" },
                match: { type: "boolean" },
                disallowAdditionalProperties: { type: "boolean" },
            },
            required: ["example", "match"],
        },
    },
    function matchExample(input, options, context) {
        if(!input) return;
        try{
            //the input provided by Spectral is a proxy and cannot be modified
            input = JSON.parse(JSON.stringify(input));

            //options
            if(options.disallowAdditionalProperties)
                setAllowAdditionalPropertiesToFalse(input);
        
            const ajv = new Ajv({strict: false})
            const validate = ajv.compile(JSON.parse(JSON.stringify(input)));
            const valid = validate(options.example)
            
            if (options.match && !valid) {
                    const error = validate.errors[0];
                    error.schemaPath.split('/').slice(1).forEach((path) => context.path.push(path));
                    let errorMessage = (error.params && error.params.additionalProperty) ?
                        error.message + ' "' + error.params.additionalProperty + '"' :
                        error.message;
                    return [{ message: 'failed valid example because: example ' + errorMessage + ' at ' + error.instancePath }];
            }
            if (!options.match && valid){
                return [{ message: 'should not match invalid example' }];
            }
        }catch(e){
            return [{ message: 'failed to validate example: ' + e.message }];
        }
    }
);


function setAllowAdditionalPropertiesToFalse(schema) {
    if (typeof schema !== 'object')
        return;

    if (schema && schema.type === 'object' && schema.additionalProperties == undefined)
        schema.additionalProperties = false;

    Object.keys(schema).forEach((key) => setAllowAdditionalPropertiesToFalse(schema[key]));
}

export default (requiredproperty, options, context) => {
    //remove last two items of the context.path array and add 'properties' and requiredProperty
    const path = [...context.path.slice(0, -2), 'properties', requiredproperty];
    const foundProperty = jsonpath(context.documentInventory.resolved, path);
    if(!foundProperty){
        return [
            {
                message: requiredproperty+' is not defined.',
            },
        ];
    }
};

/**
 * @param {{} } document
 * @param {string[]} jsonPath
 */
function jsonpath(document, path){
    for(const key of path){
        if(!document[key])
            return null;
        document = document[key];
    }
    return document;
}
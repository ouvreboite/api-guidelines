# Parameters rules

1. [path-parameters-must-be-kebab-case](#path-parameters-must-be-kebab-case)

## path-parameters-must-be-kebab-case

An example of valid kebab case parameters, both defined at the path or operation level
```yaml
#spectral-test
#spectral-should-not-fail-anywhere-✅: path-parameters-must-be-kebab-case
openapi: 3.0.1
info:
  title: Test
  version: 1.0.0
paths:
  /cats/{dog-id}: 
    get:
      parameters:
        - name: dog-id #good
          in: path
          required: true
          schema:
            type: number
  /dogs/{cat-id}: 
    parameters:
      - name: cat-id #good
        in: path
        required: true
        schema:
          type: number
    get: {}
```


Example of a wrongs parameters casing
```yaml
#spectral-test
openapi: 3.0.1
info:
  title: Test
  version: 1.0.0
paths:
  /cats/{dogId}: 
    get:
      parameters:
        - name: dogId #spectral-should-fail-here-❌: path-parameters-must-be-kebab-case
          in: path
          required: true
          schema:
            type: number
  /dogs/{catId}: 
    parameters:
      - name: catId #spectral-should-fail-here-❌: path-parameters-must-be-kebab-case
        in: path
        required: true
        schema:
          type: number
    get: {}
  /mouses/{mice-id}: 
    get:
      parameters:
        - name: mice-id #spectral-should-not-fail-here-✅: path-parameters-must-be-kebab-case
          in: path
          required: true
          schema:
            type: number
```

<details>
  <summary>Spectral rule 🤖</summary>

This use the **pathParameters** alias to target both the parameters in the "paths" and the "operations.

```yaml
#spectral-rule
path-parameters-must-be-kebab-case:
  description: Path parameters must be kebab case
  given: "#parameters[?(@.in==\"path\")]"
  severity: error
  then:
    field: name
    function: pattern
    functionOptions:
      match: "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$"
```

</details>

## required-property-must-exist

```yaml
#spectral-test
openapi: 3.0.1
info:
  title: Test
  version: 1.0.0
components:
  schemas: 
    Pet:
      required:
        - nestedschema
      type: object
      properties:
        name:
          type: string
        nestedschema:
          type: object 
          required:
            - id #spectral-should-not-fail-here-✅: required-property-must-exist
            - nonexistent #spectral-should-fail-here-❌: required-property-must-exist
          properties: 
            id: 
              type: string
```

<details>
  <summary>Spectral rule 🤖</summary>

This use the **isRequiredPropertyDefined** custom function.

```yaml
#spectral-rule
required-property-must-exist:
  description: Required property must exist
  message: "Required property must exist: {{error}}"
  given: $..required[*]
  severity: error
  then:
    function: isRequiredPropertyDefined
```

</details>
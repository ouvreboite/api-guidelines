# Some rules

1. [base-path-must-start-with-slash](#base-path-must-start-with-slash)
2. [operation-parameters-must-have-description](#operation-parameters-must-have-description)
3. [operation-must-have-description](#operation-must-have-description)
4. [operation-must-have-no-summary](#operation-must-have-no-summary)
5. [operation-must-have-at-least-one-response](#operation-must-have-at-least-one-response)
6. [request-bodies-must-have-a-content](#request-bodies-must-have-a-content)
7. [path-path-parameters-must-be-kebab-case](#path-path-parameters-must-be-kebab-case)
8. [operation-path-parameters-must-be-kebab-case](#operation-path-parameters-must-be-kebab-case)

## base-path-must-start-with-slash

We don't want static base path, because the endpoints will be aggregated and a custom base path will be injected later.

```yaml
#spectral-test: base-path-must-start-with-slash ❌
openapi: 3.0.1
info:
  title: Test
  version: 1.0.0
servers:
- url: do-not-start-with-slash
```

```yaml
#spectral-test: base-path-must-start-with-slash ✅
openapi: 3.0.1
info:
  title: Test
  version: 1.0.0
servers:
- url: /start-with-slash
```

<details>
  <summary>Spectral rule 🤖</summary>

```yaml
#spectral-rule
base-path-must-start-with-slash:
  description: Base path must start with /.
  message: "{{description}}. But was {{value}}."
  given: $.servers[*]
  severity: error
  then:
    field: url
    function: pattern
    functionOptions:
      match: "^\/"
```

</details>

## operation-parameters-must-have-description

```yaml
#spectral-test: operation-parameters-must-have-description ❌
openapi: 3.0.1
paths:
  /test/{id}:
    get:
      parameters:
      - name: id
        in: path
        required: true
        # no description for the id param
        schema:
          type: string
```

```yaml
#spectral-test: operation-parameters-must-have-description ✅
openapi: 3.0.1
paths:
  /test/{id}:
    get:
      parameters:
      - name: id
        in: path
        required: true
        description: Some description #description is set
        schema:
          type: string
```

<details>
  <summary>Spectral rule 🤖</summary>

```yaml
#spectral-rule
operation-parameters-must-have-description:
  description: Operation parameters must have a description
  given: $.paths[*][*].parameters[*]
  severity: error
  then:
    field: description
    function: truthy
```

</details>


## operation-must-have-description

```yaml
#spectral-rule
operation-must-have-description:
  description: Operation must have a description
  given: $.paths[*][*]
  severity: error
  then:
    field: description
    function: truthy
```

## operation-must-have-no-summary

Summary on operations mess up the documentation portal :(

```yaml
#spectral-rule
operation-must-have-no-summary:
  description: Operation must not have a summary
  given: $.paths[*][*]
  severity: error
  then:
    field: summary
    function: falsy
```

## operation-must-have-at-least-one-response

```yaml
#spectral-rule
operation-must-have-at-least-one-response:
  description: Operation must have at least one response
  given: $.paths[*][*]
  severity: error
  then:
    - field: responses
      function: truthy
    - field: responses
      function: length
      functionOptions:
        min: 1
```

## request-bodies-must-have-a-content

```yaml
#spectral-rule
request-bodies-must-have-a-content:
  description: Request bodies must have a content
  given: $.paths[*][*].requestBody
  severity: error
  then:
    - field: content
      function: truthy
    - field: content
      function: length
      functionOptions:
        min: 1
```

## path-parameters-must-be-kebab-case

A example valid kebab case parameters, both defined at the path or operation level
```yaml
#do-not-fail-rule: path-parameters-must-be-kebab-case ✅
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
    get: 
```


Example of a wrong parameter, defined at the operation level
```yaml
#spectral-test: path-parameters-must-be-kebab-case ❌
openapi: 3.0.1
info:
  title: Test
  version: 1.0.0
paths:
  /pets/{petId}: 
    get:
      parameters:
        - name: petId #invalid, defined at the operation level
          in: path
          required: true
          schema:
            type: number
```

```yaml
#spectral-test: path-parameters-must-be-kebab-case ❌
openapi: 3.0.1
info:
  title: Test
  version: 1.0.0
paths:
  /pets/{petId}:
    parameters:
      - name: petId #invalid, defined at the path level
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
  description: Path parameters must be kebabd case
  given: "#parameters[?(@.in==\"path\")]"
  severity: error
  then:
    field: name
    function: pattern
    functionOptions:
      match: "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$"
```

</details>
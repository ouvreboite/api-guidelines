# API rules

1. [base-path-must-start-with-slash](#base-path-must-start-with-slash)
2. [operation-parameters-must-have-description](#operation-parameters-must-have-description)
3. [operation-must-have-description](#operation-must-have-description)
4. [operation-must-have-no-summary](#operation-must-have-no-summary)
5. [operation-must-have-at-least-one-response](#operation-must-have-at-least-one-response)
6. [request-bodies-must-have-a-content](#request-bodies-must-have-a-content)

## base-path-must-start-with-slash

We don't want static base path, because the endpoints will be aggregated and a custom base path will be injected later.

OpenAPI examples:

```yaml
#spectral-test
#spectral-should-fail-anywhere-❌: base-path-must-start-with-slash
openapi: 3.0.1
info:
  title: Test
  version: 1.0.0 
servers:
- url: do-not-start-with-slash
```

```yaml
#spectral-test
#spectral-should-not-fail-anywhere-✅: base-path-must-start-with-slash
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
#spectral-test
openapi: 3.0.1
paths:
  /test/{id}:
    get: 
      parameters:
      - name: id #spectral-should-fail-here-❌: operation-parameters-must-have-description
        in: path 
        # need a description
        required: true
        schema:
          type: string
```

```yaml
#spectral-test
#spectral-should-not-fail-anywhere-✅: operation-parameters-must-have-description
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
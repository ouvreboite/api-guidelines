# Parameters rules

1. [request-bodies-must-have-a-content](#request-bodies-must-have-a-content)

## request-bodies-must-have-a-content

```yaml
#👻-failures: 0 request-bodies-must-have-a-content
openapi: 3.0.1
paths:
  /pets:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: string
      responses:
        '201':
          description: Created
```

```yaml
#👻-failures: 1 request-bodies-must-have-a-content
openapi: 3.0.1
paths:
  /pets:
    post:
      requestBody: #👻-fails-here: request-bodies-must-have-a-content
        required: true
      responses:
        '201':
          description: Created
```

<details>
  <summary>Spectral rule 🤖</summary>

```yaml
#👻-rule
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

</details>
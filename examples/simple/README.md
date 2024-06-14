# Simple example

1. This is a Spectral rule:

```yaml
#👻-rule
operation-parameters-must-have-description:
  description: Operation parameters must have a description
  given: $.paths[*][*].parameters[*]
  severity: error
  then:
    field: description
    function: truthy
```

2. This is a test case for this rule:
```yaml
#👻-failures: 1 operation-parameters-must-have-description
openapi: 3.0.1
paths:
  /test/{id}:
    get: 
      parameters:
      # the 'id' parameter needs a description
      - name: id #👻-fails-here: operation-parameters-must-have-description
        in: path 
        required: true
        schema:
          type: string
```
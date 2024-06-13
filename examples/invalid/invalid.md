# API rules

1. [base-path-must-start-with-slash](#base-path-must-start-with-slash)

## base-path-must-start-with-slash

❌ This test should not pass, as the server's url fails the rule
```yaml
#👻-failures: 0 base-path-must-start-with-slash
openapi: 3.0.1
info:
  title: Test
  version: 1.0.0
servers:
- url: do-not-start-with-slash #in fact, it should fail here
```

<details>
  <summary>Spectral rule 🤖</summary>

```yaml
#👻-rule
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
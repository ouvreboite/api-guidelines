# Operation id must be camelcase

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Examples

Standard codeblock (even yaml) can coexists with rules and won't be aggregated.
```yaml
paths:
  /todo:
    get: 
      responses: #❌403 is missing
        '401': #✅ 401 is provided
          description: Some description
        '200':
          description: Some description

```

## Rules
### 401 is required on all endpoints

```yaml
#spectral
common-responses-unauthenticated:
  description: Responses should contain common response - 401 (unauthenticated)
  message: '{{description}}. Missing {{property}}'
  severity: error
  given: $.paths..responses
  then:
    field: '401'
    function: truthy
```

### 403 is required on all endpoints
```yaml
#spectral
common-responses-unauthorized:
  description: Responses should contain common response - 403 (unauthorized)
  message: '{{description}}. Missing {{property}}'
  severity: error
  given: $.paths..responses
  then:
    field: '403'
    function: truthy
```
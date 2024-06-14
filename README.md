[![Run Poltergust Tests](https://github.com/ouvreboite/api-guidelines/actions/workflows/poltergust.yaml/badge.svg)](https://github.com/ouvreboite/api-guidelines/actions/workflows/poltergust.yaml)

# 👻 poltergust

> With poltergust, you can document, define and test your [Spectral](https://github.com/stoplightio/spectral) rules in a single place.

Poltergust is a npm CLI that looks for .md files in a directory (and sub-directories) and extract Spectral rules and test cases.
- **Rules**: any YAML codeblock starting by `#👻-rule` is considered a spectral rule and will be aggregated in the spectral.yaml file
- **Test cases**: any YAML codeblock containing `#👻-failures:` or `#👻-fails-here:` is considered an OpenAPI test case
  - `#👻-failures: X some-rule-name` expects the given rule to return exactly X failures against the OpenAPI document. 
  - `#👻-failures: 0 some-rule-name` expects the given rule to not fail the OpenAPI document. 
  - `#👻-fails-here: some-rule-name` expects the given rule to fail at a specific line of the OpenAPI document.
- **Base ruleset**: to merge the rules, a `spectral.base.yaml` file is needed. It's a standard Spectral ruleset files (with aliases, funcitons, extends, ...), with empty rules (they will be added by poltergust).

## How to run

```sh
npm install
npx poltergust ./your-rules-directory
```

## Simple example

(from [simple](examples/simple))

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

3. The spectral.base.yaml is:
```yaml
formats: ["oas3"]
rules:
#rules will be injected by poltergust
```

4. Running poltegust:
```bash
npx poltergust .\examples\simple
🔎 Testing the spectral rules from the .md files in the directory: .\examples\simple
👻 operation-parameters-must-have-description (examples\simple\README.md:6)
  ✅ Test OK (examples\simple\README.md:18)
✅ Spectral rules merged in the file: examples\simple\spectral.yaml
```

4. The aggregated Spectral ruleset can be found [here](examples/simple/spectral.yaml)

```yaml
formats: ["oas3"]
rules:
#rules will be injected by poltergust
  operation-parameters-must-have-description:
    description: Operation parameters must have a description
    given: $.paths[*][*].parameters[*]
    severity: error
    then:
      field: description
      function: truthy
```

## More examples

- [complex](examples/complex): subdirectories, functions, ...
- [invalid](examples/invalid): a test case that fails

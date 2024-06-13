[![Run Poltergust Tests](https://github.com/ouvreboite/api-guidelines/actions/workflows/poltergust.yaml/badge.svg)](https://github.com/ouvreboite/api-guidelines/actions/workflows/poltergust.yaml)

# 👻 poltergust

An npm CLI to extract, test and merge Spectral rules from .md files.

- **Rules**: A YAML codeblock starting by `#👻-rule` is considered a spectral rule and will be aggregated in the spectral.yaml file
- **Test cases**: A YAML codeblock containing `#👻-failures:` or `#👻-fails-here:` is considered an OpenAPI test case
  - `#👻-failures: X some-rule-name` expects the given rule to return only X failures for this test case. For example `#👻-failures: 0 some-rule-name` can be used to assert that a test case does not trigger a rule.
  - `#👻-fails-here: some-rule-name` expects the given rule to be trigger at this very line
- **Base ruleset**: to merge the rules, a `spectral.base.yaml` is needed. It should be a standard Spectral ruleset files, with empty rules. But it can includes extends, aliases, functions...

## Setup and run

```sh
npm install
npx poltergust test ./examples/valid
npx poltergust merge ./examples/valid
```

## Examples

- [valid](examples/valid)
- [invalid](examples/invalid)
# poltergust

An npm CLI to extract Spectral rules from .md files, merge them and test them.

- Each yaml codeblock starting by `#spectral` is considered a spectral rule and will be aggregated in the spectral.yaml file
- Each yaml codeblock starting by `#✅-test-for: some-rule-name` is considered as an OpenAPI snippet that not should fail the corresponding spectral rule
- Each yaml codeblock starting by `#❌-test-for: some-rule-name` is considered as an OpenAPI snippet that should fail the corresponding spectral rule

## Install the poltergust CLI

```sh
cd poltergust
npm install
npm link
```

## Test and merge the rules

```sh
cd ..
poltergust test ./rules
poltergust merge ./rules
```

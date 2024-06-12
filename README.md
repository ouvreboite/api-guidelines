# 👻 poltergust

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

### Example of a test output

```
🔎 Testing the spectral rules from the .md files in the directory: ./rules
👻 base-path-must-start-with-slash (rules\api.md:42)
  ✅ Test OK (rules\api.md:17)
  ✅ Test OK (rules\api.md:28)
👻 operation-parameters-must-have-description (rules\api.md:94)
  ✅ Test OK (rules\api.md:60)
  ✅ Test OK (rules\api.md:75)
👻 operation-must-have-description (rules\api.md:110)
👻 operation-must-have-no-summary (rules\api.md:125)
👻 operation-must-have-at-least-one-response (rules\api.md:138)
👻 request-bodies-must-have-a-content (rules\api.md:155)
👻 path-parameters-must-be-kebab-case (rules\parameters.md:75)
  ✅ Test OK (rules\parameters.md:9)
  ❌ Was expecting to fail rule path-parameters-must-be-kebab-case at line 24 in test (rules\parameters.md:62)
  But failed there instead:
   { start: 8, end: 8 } (rules\parameters.md:46)
   { start: 15, end: 15 } (rules\parameters.md:53)
👻 required-property-must-exist (rules\parameters.md:121)
  ✅ Test OK (rules\parameters.md:92)
```
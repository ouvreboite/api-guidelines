# Valid example

* This example contains rules accross several markdown files: [rules1.md](rules1.md) and [rules2.md](rules2.md)
  * ✅ All the test declared in those files are expected to pass
* Some of the rules use custom functions defined in the [functions](functions) directory
* [spectral.base.yaml](spectral.base.yaml) contains the base rule files that will be used to merge the rules into. For example, it contains the extends, aliases and functions declarations
* [spectral.yaml](spectral.yaml) is the output of the merge operation: [spectral.base.yaml](spectral.base.yaml) + all the rules found in [rules1.md](rules1.md) and [rules2.md](rules2.md)

## Test ouput

```
npx poltergust test .\examples\valid
🔎 Testing the spectral rules from the .md files in the directory: .\examples\valid
👻 base-path-must-start-with-slash (examples\valid\rules1.md:40)
  ✅ Test OK (examples\valid\rules1.md:17)
  ✅ Test OK (examples\valid\rules1.md:27)
👻 operation-parameters-must-have-description (examples\valid\rules1.md:91)
  ✅ Test OK (examples\valid\rules1.md:58)
  ✅ Test OK (examples\valid\rules1.md:73)
👻 operation-must-have-description (examples\valid\rules1.md:107)
👻 operation-must-have-no-summary (examples\valid\rules1.md:122)
👻 operation-must-have-at-least-one-response (examples\valid\rules1.md:135)
👻 request-bodies-must-have-a-content (examples\valid\rules1.md:152)
👻 path-parameters-must-be-kebab-case (examples\valid\rules2.md:49)
  ✅ Test OK (examples\valid\rules2.md:11)
👻 required-property-must-exist (examples\valid\rules2.md:96)
  ✅ Test OK (examples\valid\rules2.md:66)
```
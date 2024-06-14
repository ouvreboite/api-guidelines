# Valid example

* This example contains rules accross several markdown files: [rules1.md](rules1.md) and [rules2.md](rules2.md) and even subdirectories [subdirectory/subrules.md](subdirectory/subrules.md)
  * ✅ All the test declared in those files are expected to pass
* Some of the rules use custom functions defined in the [functions](functions) directory
* [spectral.base.yaml](spectral.base.yaml) contains the base rule files that will be used to merge the rules into. For example, it contains the extends, aliases and functions declarations
* [spectral.yaml](spectral.yaml) is the output of the merge operation: [spectral.base.yaml](spectral.base.yaml) + all the rules found in [rules1.md](rules1.md) and [rules2.md](rules2.md)

## Test ouput

```
npx poltergust .\examples\valid
🔎 Testing the spectral rules from the .md files in the directory: .\examples\valid
👻 base-path-must-start-with-slash (examples\valid\rules1.md:39)
  ✅ Test OK (examples\valid\rules1.md:16)
  ✅ Test OK (examples\valid\rules1.md:26)
👻 operation-parameters-must-have-description (examples\valid\rules1.md:90)
  ✅ Test OK (examples\valid\rules1.md:57)
  ✅ Test OK (examples\valid\rules1.md:72)
👻 operation-must-have-description (examples\valid\rules1.md:106)
👻 operation-must-have-no-summary (examples\valid\rules1.md:121)
👻 operation-must-have-at-least-one-response (examples\valid\rules1.md:134)
👻 path-parameters-must-be-kebab-case (examples\valid\rules2.md:49)
  ✅ Test OK (examples\valid\rules2.md:11)
👻 required-property-must-exist (examples\valid\rules2.md:96)
  ✅ Test OK (examples\valid\rules2.md:66)
👻 request-bodies-must-have-a-content (examples\valid\subdirectory\subrules.md:41)
  ✅ Test OK (examples\valid\subdirectory\subrules.md:8)
  ✅ Test OK (examples\valid\subdirectory\subrules.md:25)
✅ Spectral rules merged in the file: examples\valid\spectral.yaml
```
* This example contains rules accross several markdown files: [rules1.md](rules1.md) and [rules2.md](rules2.md)
  * ✅ All the test declared in those files are expected to pass
* Some of the rules use custom functions defined in the [functions](functions) directory
* [spectral.base.yaml](spectral.base.yaml) contains the base rule files that will be used to merge the rules into. For example, it contains the extends, aliases and functions declarations
* [spectral.yaml](spectral.yaml) is the output of the merge operation: [spectral.base.yaml](spectral.base.yaml) + all the rules found in [rules1.md](rules1.md) and [rules2.md](rules2.md)
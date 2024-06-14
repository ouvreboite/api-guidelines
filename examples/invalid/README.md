# Invalid example

* This example contains a rule in the [invalid.md](invalid.md) file
  * ❌ The test for this rule is expected to NOT pass

## Test ouput

```
npx poltergust .\examples\invalid
🔎 Testing the spectral rules from the .md files in the directory: .\examples\invalid
👻 base-path-must-start-with-slash (examples\invalid\invalid.md:22)
  ❌ Expected 0 failure(s) for rule base-path-must-start-with-slash in test (examples\invalid\invalid.md:9)
  But got 1 instead:
   { start: 6, end: 6 } (examples\invalid\invalid.md:15)
```
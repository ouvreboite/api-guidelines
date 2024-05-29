# api-guidelines
A test repository to describe API guidelines and create a spectral rule set from them.

Rules are simple .md files under the /rules folders.
Each yaml codeblock starting by #spectral is considered a spectral rule and will be aggregated in the spectral.yaml file

## Extract and merge rules

```sh
npm install -g @stoplight/spectral-cli
npm install -g yaml-lint
python tooling/merge_rules.py
```

## Validate merged ruleset

```sh
yamllint spectral.yaml
spectral lint tooling/test.oas.yaml --ruleset spectral.yaml
```

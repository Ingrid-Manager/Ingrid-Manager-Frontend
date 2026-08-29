# Branch policy

Always develop and push changes on the branch `claude-dev` (not on a
newly generated per-session branch), unless the user explicitly asks
for a different branch.

# Commit message policy

Write all commit messages in English, following the Conventional
Commits specification (https://www.conventionalcommits.org/en/v1.0.0/#specification):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Use the standard types: `feat`, `fix`, `docs`, `style`, `refactor`,
`perf`, `test`, `build`, `ci`, `chore`, `revert`.

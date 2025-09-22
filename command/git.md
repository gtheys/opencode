---
description: Commit don't push
agent: build
---

run the command:

!git diff --staged

- commit only the files that are already staged
- don't add any other files
- NO push

# Structuree the commit

Conventional Commits for or commit convention and PR title.

type(optional scope): $ARGUMENTS

Whereas the type can be as follows:

- fix: type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning)
- feat: type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning
- BREAKING CHANGE: type introduces a breaking API change (correlating with MAJOR in Semantic Versioning)
- types other than fix: and feat: are allowed, for example @commitlint/config-conventional recommends build:, chore:, ci:, docs:, style:, refactor:, perf:, test:, and others

Example:

for the optional scope check the what would be the most meaningfull based on the commit.

feat(api): $ARGUMENTS

Make sure to write a detailed description

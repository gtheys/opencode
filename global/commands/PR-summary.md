---
description: "write a detailed pr descirption inf github markdown"
model: github-copilot/claude-sonnet-4.5
temperature: 0.1
agent: general
---

## Context

- PR_TITLE: [$1] ${Short, action-oriented title}
  Example: [IMP-7829] Fix dual-write soft-delete: schema filtering, NOT NULL violations, and N+1 queries
- TICKET: $1 (e.g., IMP-7829)
- BRANCH: $1-$2 (e.g., IMP-7829-getting-error-after-import-delete-employees)
- BASE_BRANCH: develop

Generate a markdown document with clear hierarchy, code blocks, and tables. Make it suitable for: Create a single file at `notes/PR/`${PR_TITLE}

````md
## Context
- JIRA Ticket: $1
- Base branch: develop
- PR title: ${PR_TITLE}

Generate a concise GitHub PR description using the template below.
Tone: technical, clear, minimal. Prefer bullets over paragraphs.
Do not invent information — infer only from the provided git logs/diffs.

## Inputs (paste raw outputs)
```text
git log develop..HEAD --oneline
git diff develop..HEAD --stat
git log develop..HEAD -p
````

---

## RENDER EXACTLY THIS TEMPLATE (no extra sections)

# Description

**JIRA Ticket:** $1
**Related Documentation:** <links or "N/A">

**Summary**

- What changed (1–3 bullets)
- Why the change was needed
- Any notable constraints or assumptions

**Dependencies**

- None | List services, migrations, flags, or follow-up PRs

## Type of change

(Delete options that are not relevant)

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

# Screenshots (if any)

- N/A | brief description

# Checklist

- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Complex logic is commented
- [ ] Documentation updated (if needed)
- [ ] No new warnings introduced
- [ ] Tests added or updated
- [ ] Unit tests pass locally
- [ ] Dependent changes merged

---

## Content Rules (important)

- Keep the entire PR under ~400 words.
- Do **not** include commit-by-commit breakdowns.
- Mention performance or DB impact **only if it materially changed**.
- Prefer concrete facts (“replaced upsert with UPDATE”) over process talk.
- If tests were not added, explain why in one line.

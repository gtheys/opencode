---
name: pr-summary
description: >
  Generate a detailed GitHub PR description following the exact project template and create/update the PR using gh CLI.
  Trigger when user says "pr summary", "create pr", "pr-summary", "generate pr description",
  or mentions creating a pull request for a JIRA ticket.
---

# PR Summary

Generate a comprehensive GitHub PR description by analyzing git history and diff, then create or update the PR via `gh` CLI.

## Prerequisites

- `gh` CLI authenticated: `gh auth status`
- In a git repository with a remote origin
- Base branch is `develop`

## Workflow

### Step 1: Collect Inputs

Ask the user for the JIRA ticket if not provided:
- **JIRA Ticket**: (e.g., IMP-7829)
- **PR Title**: Optional, defaults to branch name derived title

### Step 2: Sync Branch

```bash
git fetch origin
git pull origin develop
```

If pull fails due to conflicts or uncommitted changes, warn the user and ask to continue or abort.

### Step 3: Collect Git Data

Run these commands and capture output:

```bash
git log develop..HEAD --oneline
git diff develop..HEAD --stat
git diff develop..HEAD --name-only
git log develop..HEAD -p
```

Also collect:
- Current branch: `git branch --show-current`
- Repo name: `basename $(git rev-parse --show-toplevel)`

### Step 4: Check for Existing PR

```bash
GH_PAGER=cat gh pr view $(git branch --show-current) --json number,url,title 2>/dev/null
```

If found, note the PR number and URL for updating later.

### Step 5: Generate PR Description

**IMPORTANT**: Generate the PR description following **EXACTLY** this template. Do NOT add extra sections. Do NOT deviate from this structure.

Use the collected git data to infer what changed. Do not invent information — infer only from the provided git logs/diffs.

```markdown
# Description

**JIRA Ticket:** TICKET
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
```

### Content Rules (MANDATORY)

1. **Keep the entire PR under ~400 words.**
2. **Do NOT include commit-by-commit breakdowns.**
3. **Mention performance or DB impact only if it materially changed.**
4. **Prefer concrete facts** ("replaced upsert with UPDATE") over process talk.
5. **If tests were not added, explain why in one line.**
6. **Tone: technical, clear, minimal. Prefer bullets over paragraphs.**
7. **Do NOT add extra sections** like "Files Changed", "Commit History", or "Diff Stats".
8. **Do NOT include the git log or diff stat in the PR body.**

### How to fill the template

- **Summary**: Read the git log and diff. Summarize in 1-3 bullets what changed and why. Be concrete (e.g., "Fixed N+1 query in employee repository by adding eager loading" not "Fixed performance issue").
- **Dependencies**: Check if the diff shows changes to docker-compose, package.json, or references to other services. If nothing stands out, write "None".
- **Type of change**: Check only the relevant box based on the changes (Bug fix, New feature, Breaking change, Documentation update). Delete or leave unchecked the others.
- **Screenshots**: If UI files changed (.tsx, .jsx, .vue, .css), ask if screenshots are needed. Otherwise write "N/A".
- **Checklist**: Leave all unchecked. The human will check them.

### Step 6: Save to File

Create directory `notes/PR/` if it doesn't exist.

Save the generated description to:
```
notes/PR/[TICKET]-<slug>.md
```

Where slug is the PR title lowercased, spaces to dashes, max 5 words.

Example: `notes/PR/IMP-7829-fix-dual-write-soft-delete.md`

Add YAML frontmatter:
```yaml
---
createdAt: <ISO8601>
ticket: <TICKET>
branch: <current-branch>
base: develop
---
```

### Step 7: Create or Update PR

**PR Title format**: `[TICKET] <Short, action-oriented title>`
Example: `[IMP-7829] Fix dual-write soft-delete: schema filtering, NOT NULL violations, and N+1 queries`

**If existing PR found:**
```bash
gh pr edit <branch> --title "[TICKET] <title>" --body "<description>"
```

**If no existing PR:**
```bash
gh pr create \
  --title "[TICKET] <title>" \
  --body "<description>" \
  --base develop
```

**Always create a regular PR, NOT draft.**

Capture the PR URL from the output.

### Step 8: Report Results

Show the user:
1. PR URL (new or updated)
2. Path to saved markdown file
3. Confirmation that a regular (non-draft) PR was created

## Example Invocation

**User**: "pr summary IMP-7829"
**AI**: Runs workflow, generates description following exact template, creates regular PR, reports URL.

**User**: "create a PR for this branch"
**AI**: Asks for JIRA ticket, runs workflow, creates regular PR.

## Commands Reference

```bash
# Sync
git fetch origin
git pull origin develop

# Git data
git log develop..HEAD --oneline
git diff develop..HEAD --stat
git diff develop..HEAD --name-only
git log develop..HEAD -p

# Check existing PR
GH_PAGER=cat gh pr view $(git branch --show-current) --json number,url,title 2>/dev/null

# Create regular PR (no --draft)
gh pr create --title "..." --body "..." --base develop

# Update PR
gh pr edit <branch> --title "..." --body "..."
```

---
name: pr-reviewer
description: >
  GitHub PR reviewer. Use when the user mentions a PR number, asks to review a PR,
  says "check PR #123", or wants to inspect pull request diffs, CI status, and
  code changes. Also use for posting PR reviews or checking open PRs.
---

# PR Reviewer

Review GitHub pull requests using the GitHub CLI (`gh`).

## Prerequisites

Ensure `gh` is authenticated:
```bash
gh auth status
```

Set GH_TOKEN if needed:
```bash
export GH_TOKEN=<token>
```

## Fetching PR Information

### With PR number
```bash
GH_PAGER=cat gh pr view <PR_NUMBER> --json title,body,baseRefName,headRefName,files,additions,deletions,author,number
GH_PAGER=cat gh pr checks <PR_NUMBER>
GH_PAGER=cat gh pr diff <PR_NUMBER>
GH_PAGER=cat gh pr diff <PR_NUMBER> --name-only
GH_PAGER=cat gh pr view <PR_NUMBER> --json commits --jq '.commits[].messageHeadline'
```

### Without PR number (detect current branch)
```bash
GH_PAGER=cat gh pr view --json number,title,baseRefName,headRefName 2>/dev/null
```

### Fallback
```bash
git log develop..HEAD --oneline
git diff develop..HEAD
```

## Pre-Review Checks

### 1. CI Status
Run `GH_PAGER=cat gh pr checks <PR_NUMBER>`. If failing, flag as blocker.

### 2. PR Size
- **Acceptable**: <500 lines, <20 files
- **Warning**: 500–1000 lines or 20–30 files
- **Block-worthy**: >1000 lines or >30 files — recommend splitting

### 3. PR Description Quality
- Missing/empty → must-fix
- Under ~20 chars → low-effort
- UI changes without screenshots → flag
- No test plan → note

### 4. Linked Issues
Check for `#123`, `JIRA-456` in PR body. Flag if none.

### 5. Commit Hygiene
- Flag low-quality: "fix", "wip", "asdf"
- Flag excessive commits needing squash
- Note if not following conventional commits

## Review Process

1. Complete pre-review checks
2. Fetch diff and metadata
3. Identify modified/added/deleted files
4. Read diff carefully
5. For context beyond diff, fetch full file:
   ```bash
   GH_PAGER=cat gh pr view <PR> --json headRefName -q '.headRefName' | xargs -I {} git show {}:<filepath>
   ```
6. For signature changes, search for callers:
   ```bash
   grep -rn "functionName" --include="*.ts" --include="*.js" .
   ```

## Review Checklist

Same as code-reviewer skill plus:

### PR-Specific
- Title follows conventional commit format
- Description explains what and why
- Linked issue/ticket present
- Appropriate reviewers assigned
- Labels applied correctly

## Review Output Format

```
## PR Summary
PR #<number>: <title>
Author: <author>
Base: <base> ← <head>
Files changed: <count> (+<additions> -<deletions>)
Linked issues: #123, PROJ-456

## Pre-Review Status
CI: ✅ Passing | ❌ Failing | ⏳ Pending
Size: ✅ Small | ⚠️ Large | ❌ Too large
Description: ✅ Good | ⚠️ Missing test plan | ❌ Empty
Commits: ✅ Clean | ⚠️ Needs squashing | ❌ Poor messages
```

Then list issues with `[CRITICAL]`, `[HIGH]`, `[MEDIUM]` as in code review.

## Verdict

```
## Verdict: ✅ APPROVE | ⚠️ WARNING | ❌ BLOCK

Issues:
  Critical: <n>
  High: <n>
  Medium: <n>
```

## Posting Reviews (Optional)

Comment:
```bash
gh pr review <PR_NUMBER> --comment --body "<review_body>"
```

Approve:
```bash
gh pr review <PR_NUMBER> --approve --body "LGTM — no critical issues."
```

Request changes:
```bash
gh pr review <PR_NUMBER> --request-changes --body "<review_body>"
```

## Finding Open PRs

```bash
# User's open PRs
GH_PAGER=cat gh search prs --author @me --state open

# PRs needing approvals (salary-hero org)
GH_PAGER=cat gh api 'search/issues?q=org:salary-hero+type:pr+state:open+author:@me&per_page=30' \
  --jq '.items[] | "\(.repository_url | split("/") | .[-2:] | join("/"))|\(.number)|\(.title)|\(.html_url)"'
```

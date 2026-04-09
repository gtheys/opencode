---
description: Triage unresolved PR comments and plan resolution
agent: plan
---

# Fetch unresolved PR review comments

If no PR number is provided in $ARGUMENTS, ask for it.

Use the skill gh-unresolved-comments

# Assess each unresolved comment

For each thread in the `unresolved_threads` array from the JSON output, read the referenced file in the codebase and check the current code around the commented line.

Classify each comment as **VALID** or **INVALID**:

## VALID — the comment needs action

- Identifies a real bug, security issue, or logic error
- Suggests a meaningful improvement to quality, readability, or performance
- Raises a legitimate architectural or design concern
- Points out missing error handling, edge cases, or tests

## INVALID — the comment should be dismissed

- Refers to code that has already been changed or fixed (outdated diff)
- Is a style nitpick with no functional impact
- Is based on a misunderstanding of the code's intent
- Is already answered elsewhere in the PR
- Is purely cosmetic with no meaningful impact

# Handle INVALID comments

For each INVALID comment, auto-resolve the thread on GitHub:
!gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "{thread_id}"}) { thread { isResolved } } }'

# Handle VALID comments

For each VALID comment, create a resolution plan as a markdown checklist.

## Plan structure

```
# Resolution Plan — PR #{pr_number}

> **{pr_title}**
> {pr_url}

## Summary

- **Total unresolved:** {total}
- **Valid (action needed):** {valid_count}
- **Invalid (auto-resolved):** {invalid_count}

## Tasks

### 1. `{file_path}` (line {line})

- [ ] {specific actionable task description}

**Reviewer:** @{author}
**Comment:** > {original comment}
**Why valid:** {reason}
```

Write the plan to `gh-comment-resolve-plan.md` in the repository root.

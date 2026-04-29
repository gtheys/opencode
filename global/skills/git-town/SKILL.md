---
name: git-town
description: "Expert guide for Git Town stacked branch workflows. Use this skill when the user works with git town commands (sync, append, prepend, ship, propose, detach, merge, compress), encounters merge conflicts during git town sync, needs to restack or rebase stacked branches, or asks about git town best practices. Covers the full lifecycle of stacked branches: creating, syncing, resolving conflicts, and shipping. Requires git-town CLI installed."
required_tools:
  - git
  - git-town
---

# Git Town Stacked Branch Workflow

## Prerequisites

Git Town must be installed and initialized:
```bash
git town --version   # verify installed
git town config      # verify initialized (main branch, perennial branches set)
```

If not initialized:
```bash
git town init
```

## Command Quick Reference

| Command | Purpose |
|---------|---------|
| `git town hack <branch>` | Create new feature branch off main branch |
| `git town append <branch>` | Create child branch of current branch |
| `git town prepend <branch>` | Create parent branch above current branch |
| `git town sync` | Sync current branch (and ancestors) with remote |
| `git town sync --stack` | Sync all branches in the current stack |
| `git town continue` | Resume after resolving a conflict |
| `git town skip` | Skip current branch in a multi-branch sync |
| `git town undo` | Undo the last git town command |
| `git town propose` | Create a PR for the current branch |
| `git town ship` | Merge and delete the current feature branch |
| `git town compress` | Squash all commits on current branch into one |
| `git town delete` | Delete an obsolete feature branch |
| `git town detach` | Move branch out of its stack |
| `git town merge` | Combine current branch with its parent |
| `git town diff-parent` | Show changes committed to current branch |
| `git town branch` | Display branch hierarchy |
| `git town set-parent` | Change a branch's parent |
| `git town swap` | Swap position with parent branch |

## Core Workflow: Creating Stacked Branches

### Start a new feature from main/develop
```bash
git checkout develop
git town hack DP-93-feature-name
```

### Add a child branch (stack on top)
```bash
git town append DP-94-next-feature
```

### Add a parent branch (insert below current)
```bash
git town prepend DP-92-infra-work
```

## Core Workflow: Syncing Stacked Branches

### Sync a single branch
```bash
git checkout DP-97-my-feature
git town sync
```

This will:
1. Update the perennial/main branch from remote
2. Rebase each ancestor branch onto its parent
3. Rebase the current branch onto its (updated) parent
4. Push updated branches

### Sync all branches in the stack
```bash
git town sync --stack
```

## CRITICAL: Resolving Conflicts During Sync

When `git town sync` hits a conflict, follow this exact sequence:

### Step 1: Check what's conflicted
```bash
git status
```

### Step 2: Resolve the conflict
Edit the conflicted file(s) to your desired state.

### Step 3: Stage the resolution
```bash
git add <resolved-file>
```

### Step 4: Continue git town (NOT git rebase --continue)
```bash
git town continue
```

**IMPORTANT:** Always use `git town continue`, never `git rebase --continue`. Git Town manages the rebase internally and `git town continue` handles all its bookkeeping.

### If you want to skip a branch
```bash
git town skip
```

### If you want to abort everything
```bash
git town undo
```

## CRITICAL: Bottom-Up Sync for Complex Stacks

When a parent branch has been merged (via PR) into develop, its commits now exist on develop. Child branches that still have those commits will have **duplicate/rebase conflicts**.

**The correct approach is to sync bottom-up:**

### Step 1: Sync from the bottom of the stack
```bash
# If stack is: develop -> DP-94 -> DP-95 -> DP-96 -> DP-97
# Start with the branch closest to develop:

git checkout DP-94-branch-name  # may be deleted if merged
git town sync

git checkout DP-95-branch-name
git town sync

git checkout DP-96-branch-name
git town sync

git checkout DP-97-branch-name
git town sync
```

### Step 2: Handle "already merged" branches
If `git town sync` says a branch was deleted, it means that branch was already merged into develop. Git Town automatically removes it and re-parents its children.

### Step 3: Handle "patch already upstream" conflicts
When rebasing, git will try to replay commits that already exist in the parent. You'll see messages like:
```
dropping <hash> <message> -- patch contents already upstream
```

This is expected and correct. Let git skip them automatically.

If you get a real content conflict (not just "already upstream"):
1. Resolve the conflict in the file
2. `git add <file>`
3. `git town continue` (or `git rebase --skip` if the commit is fully redundant)

## CRITICAL: Manual Rebase for Complex Stacks

When `git town sync` creates nested/confusing conflicts (especially with stale merge commits), use manual rebase:

### Scenario: Stack needs restacking onto updated parents
```
develop -> DP-95 (updated) -> DP-96 (stale) -> DP-97 (stale)
```

### Step 1: Rebase each branch onto its updated parent

For DP-96, find the last commit that belongs to DP-95 (the merge base before DP-96's own commits):
```bash
# Find the merge base (last shared commit)
git merge-base DP-96 DP-95

# Rebase DP-96 onto updated DP-95, starting after the shared commits
git rebase --onto DP-95 <merge-base-commit> DP-96
```

For DP-97, repeat the process:
```bash
git merge-base DP-97 DP-96
git rebase --onto DP-96 <merge-base-commit> DP-97
```

### Step 2: Force push each updated branch
```bash
git push --force-with-lease origin DP-96-branch-name
git push --force-with-lease origin DP-97-branch-name
```

### Step 3: Clean up stale merge commits
If your history has duplicate merge commits (e.g., two `[DP-93]` commits that are both squash-merges from PRs):
```bash
# Identify the stale commits
git log --oneline <branch> | head -10

# Rebase to remove them
git rebase --onto <first-good-parent> <stale-commit> <branch>
```

## Common Conflict Patterns & Solutions

### Pattern: "disbursement_type" or column source conflicts
When HEAD uses `ui.disbursement_type` (from `user_identity`) and incoming uses `e.disbursement_type` (from `employment`):

**Resolution:** Check the database schema:
```bash
psql <connection-string> -c "SELECT table_name, column_name FROM information_schema.columns WHERE column_name = 'disbursement_type';"
```

Use the correct table alias based on what the schema says. If the column doesn't exist on a table, that side is wrong.

### Pattern: Duplicate `normalizeForCompare` or helper function
When the same function appears twice due to a rebase conflict:

**Resolution:** Keep only one copy (prefer the version with improvements like `localeCompare`). Remove all conflict markers and duplicate definitions.

### Pattern: LEFT JOIN conflicts
When HEAD adds a JOIN (e.g., `LEFT JOIN user_balance`) and incoming doesn't:

**Resolution:** Check if the table/column relationship exists in the database schema. If the FK exists, keep the JOIN.

### Pattern: Nested conflict markers (<<<<<<< inside <<<<<<<)
This happens when `git town sync` rebase conflicts on top of unresolved conflicts.

**Resolution:** Abort the sync, undo, and manually rebase bottom-up instead:
```bash
git rebase --abort
git town undo
# Then follow the Manual Rebase steps above
```

## Lineage Management

### Check current lineage
```bash
git town config
```

### Set a branch's parent
```bash
git town set-parent
```

### View branch hierarchy
```bash
git town branch
```

## Dangerous Operations: NEVER Do These

| Operation | Why |
|-----------|-----|
| `git push --force` (without `--lease`) | Can overwrite others' work |
| `git rebase --continue` during git town sync | Use `git town continue` instead |
| `git town undo` after manual fix | May undo your manual work |
| Force push to main/develop | Destroys shared history |

## Debugging

### View git town's run log
```bash
git town runlog
```

### Check git town status after a failed command
```bash
git town status
```

### Verbose sync to see all git commands
```bash
git town sync --verbose
```

### Dry run (see what would happen without executing)
```bash
git town sync --dry-run
```

## Typical Workflow Summary

```
1. Create branches:      git town hack DP-93-feature
2. Add child branches:   git town append DP-94-next
3. Commit work normally
4. Before PR, sync:      git town sync
5. If conflict:          resolve → git add → git town continue
6. Create PR:            git town propose
7. After merge:          git town sync (cleans up merged branches)
```

For complex stacks where a parent was merged via PR:
```
1. git checkout develop && git pull
2. Sync bottom-up through the stack
3. For each branch: git checkout <branch> && git town sync
4. If conflicts: resolve → git add → git town continue
5. If git town gets confused: abort, undo, and rebase manually (see above)
```
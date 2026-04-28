<!-- AIDEV-NOTE: HumanLayer workflow skill. Transformed from coding/commands/implement.md to pi SKILL.md format. -->
---
name: ralph-impl
description: Implement tasks from an approved Jira plan. Trigger on /skill:ralph-impl <JIRA-ID>. Fetches ticket and plan, creates a git worktree, and launches implementation in a new pi session.
---

# Ralph Implement

Implement tasks from an approved Jira plan by creating a git worktree and launching a focused pi session.

## Trigger

`/skill:ralph-impl <JIRA-ID>`

Example: `/skill:ralph-impl ENG-1234`

## Workflow

### Step 1: Fetch Ticket from Taskwarrior

Run:
```bash
task jiraid:$1 status:pending export
```

Verify the ticket is in "ready for dev" state. If not, exit with guidance:
- "research in review" → "Run: /skill:ralph-plan $1 to create a plan"
- "plan in review" → "Approve the plan first: task jiraid:$1 modify work_state:ready_for_dev"
- "in dev" → "Implementation already in progress. Resume in the worktree."

### Step 2: Read Implementation Plan

Find and read the plan at `thoughts/shared/plans/YYYY-MM-DD-$1-*.md`.

If no plan found, exit with: "No plan found for $1. Run: /skill:ralph-plan $1"

### Step 3: Move Ticket to "In Dev"

```bash
task jiraid:$1 modify work_state:in_dev
```

### Step 4: Create Git Worktree

Create an isolated worktree for development:

```bash
# Remove existing worktree if present
rm -rf ~/wt/humanlayer/$1
git worktree prune

# Create new worktree
git worktree add ~/wt/humanlayer/$1 -b feature/$1
```

### Step 5: Launch New Pi Session in Worktree

Launch a new pi session in the worktree:

```bash
cd ~/wt/humanlayer/$1 && pi
```

### Step 6: Hand Off to Implementation Agent

In the new pi session, the user should run:
```
/skill:implement-plan thoughts/shared/plans/YYYY-MM-DD-$1-*.md
```

Provide a summary to the user:
```
═══════════════════════════════════════════════════════════════
  WORKTREE CREATED — READY FOR IMPLEMENTATION
═══════════════════════════════════════════════════════════════

Jira:       $1
Worktree:   ~/wt/humanlayer/$1
Branch:     feature/$1
Plan:       thoughts/shared/plans/YYYY-MM-DD-$1-*.md

Next steps in the worktree session:
1. /skill:implement-plan thoughts/shared/plans/YYYY-MM-DD-$1-*.md
2. Follow the plan phases one by one
3. Run /commit after each phase
4. Run /skill:validate-plan when complete

The thoughts/ directory is synced between main repo and worktrees.
Use relative paths starting with thoughts/shared/...
═══════════════════════════════════════════════════════════════
```

## Worktree Strategy

- **Main repo**: Your stable branch, keeps `thoughts/` directory
- **Worktree**: `~/wt/humanlayer/$1` — isolated development environment
- **Synced**: The `thoughts/` directory is accessible from both main repo and worktrees
- **Always use relative paths**: `thoughts/shared/...` not absolute paths

## Notes

- The main repo keeps the `thoughts/` directory; worktrees share it via the same filesystem
- Run `humanlayer thoughts sync` after creating/modifying documents in worktrees
- To clean up after merging:
  ```bash
  rm -rf ~/wt/humanlayer/$1
  git worktree prune
  git branch -d feature/$1
  ```

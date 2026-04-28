---
description: Implement highest priority small ticket with worktree setup
argument-hint: "[ticket-id]"
---

## PART I — IF A TICKET IS MENTIONED

1. Fetch the selected item into thoughts with the ticket number — `./thoughts/shared/tickets/ENG-xxxx.md`
2. Read the ticket and all comments to understand the implementation plan and any concerns

## PART I — IF NO TICKET IS MENTIONED

1. Read `/skill:taskwarrior-plan`
2. Fetch the top 10 priority items with status "ready for dev", noting all items
3. Select the highest priority SMALL or XS issue from the list (if no SMALL or XS issues exist, EXIT IMMEDIATELY and inform the user)
4. Fetch the selected item into thoughts with the ticket number — `./thoughts/shared/tickets/ENG-xxxx.md`
5. Read the ticket and all comments to understand the implementation plan and any concerns

## PART II — NEXT STEPS

1. Move the item to "in dev"
2. Identify the linked implementation plan document
3. If no plan exists, move the ticket back to "ready for spec" and EXIT with an explanation

4. Set up worktree for implementation:
   - Read `hack/create_worktree.sh` and create a new worktree with the branch name: `./hack/create_worktree.sh ENG-XXXX BRANCH_NAME`
   - Launch implementation session: `humanlayer-nightly launch --model opus --dangerously-skip-permissions --dangerously-skip-permissions-timeout 15m --title "implement ENG-XXXX" -w ~/wt/humanlayer/ENG-XXXX "/skill:implement-plan and when you are done implementing and all tests pass, read /commit and create a commit, then read /skill:describe-pr and create a PR, then add a comment to the ticket with the PR link"`

When fetching items, get the top 10 by priority but only work on ONE item — specifically the highest priority SMALL or XS sized issue.

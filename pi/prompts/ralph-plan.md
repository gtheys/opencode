---
description: Create implementation plan for highest priority ticket ready for spec
argument-hint: "[ticket-id]"
---

## PART I — IF A TICKET IS MENTIONED

1. Fetch the selected item into thoughts with the ticket number — `./thoughts/shared/tickets/ENG-xxxx.md`
2. Read the ticket and all comments to learn about past implementations and research, and any questions or concerns about them

## PART I — IF NO TICKET IS MENTIONED

1. Read `/skill:taskwarrior-plan`
2. Fetch the top 10 priority items with status "ready for spec", noting all items
3. Select the highest priority SMALL or XS issue from the list (if no SMALL or XS issues exist, EXIT IMMEDIATELY and inform the user)
4. Fetch the selected item into thoughts with the ticket number — `./thoughts/shared/tickets/ENG-xxxx.md`
5. Read the ticket and all comments to learn about past implementations and research, and any questions or concerns about them

## PART II — NEXT STEPS

1. Move the item to "plan in progress"
2. Read `/skill:create-plan`
3. Determine if the item has a linked implementation plan document
4. If the plan exists, you're done, respond with a link to the ticket
5. If the research is insufficient or has unanswered questions, create a new plan document following the instructions in `/skill:create-plan`

6. When the plan is complete, `humanlayer thoughts sync` and attach the doc to the ticket and create a terse comment with a link to it (re-read `/skill:taskwarrior-plan` if needed)
7. Move the item to "plan in review"

## PART III — When You're Done

Print a message for the user (replace placeholders with actual values):

```
✅ Completed implementation plan for ENG-XXXX: [ticket title]

Approach: [selected approach description]

The plan has been:

Created at thoughts/shared/plans/YYYY-MM-DD-ENG-XXXX-description.md
Synced to thoughts repository
Attached to the ticket
Ticket moved to "plan in review" status

Implementation phases:
- Phase 1: [phase 1 description]
- Phase 2: [phase 2 description]
- Phase 3: [phase 3 description if applicable]
```

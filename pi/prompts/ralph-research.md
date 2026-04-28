---
description: Research highest priority ticket needing investigation
argument-hint: "[ticket-id]"
---

## PART I — IF A TICKET IS MENTIONED

1. Fetch the selected item into thoughts with the ticket number — `./thoughts/shared/tickets/ENG-xxxx.md`
2. Read the ticket and all comments to understand what research is needed and any previous attempts

## PART I — IF NO TICKET IS MENTIONED

1. Read `/skill:taskwarrior-plan`
2. Fetch the top 10 priority items from taskwarrior with status "research needed", noting all items
3. Select the highest priority SMALL or XS issue from the list (if no SMALL or XS issues exist, EXIT IMMEDIATELY and inform the user)
4. Fetch the selected item into thoughts with the ticket number — `./thoughts/shared/tickets/ENG-xxxx.md`
5. Read the ticket and all comments to understand what research is needed and any previous attempts

## PART II — NEXT STEPS

1. Move the item to "research in progress" using taskwarrior
2. Read any linked documents to understand context
3. If insufficient information to conduct research, add a comment asking for clarification and move back to "research needed"

4. Conduct the research:
   - Read `/skill:research-codebase` for guidance on effective codebase research
   - If the comments suggest web research is needed, search the web for external solutions, APIs, or best practices
   - Search the codebase for relevant implementations and patterns
   - Examine existing similar features or related code
   - Identify technical constraints and opportunities
   - Be unbiased — don't think too much about an ideal implementation plan, just document all related files and how the systems work today
   - Document findings in a new thoughts document: `thoughts/shared/research/YYYY-MM-DD-ENG-XXXX-description.md`
     - Format: `YYYY-MM-DD-ENG-XXXX-description.md` where:
       - YYYY-MM-DD is today's date
       - ENG-XXXX is the ticket number (omit if no ticket)
       - description is a brief kebab-case description of the research topic

5. Synthesize research into actionable insights:
   - Summarize key findings and technical decisions
   - Identify potential implementation approaches
   - Note any risks or concerns discovered
   - Run `humanlayer thoughts sync` to save the research

6. Update the ticket:
   - Attach the research document to the ticket
   - Add a comment summarizing the research outcomes
   - Move the item to "research in review"

## PART III — When You're Done

Print a message for the user (replace placeholders with actual values):

```
✅ Completed research for ENG-XXXX: [ticket title]

Research topic: [research topic description]

The research has been:

Created at thoughts/shared/research/YYYY-MM-DD-ENG-XXXX-description.md
Synced to thoughts repository
Attached to the ticket
Ticket moved to "research in review" status

Key findings:
- [Major finding 1]
- [Major finding 2]
- [Major finding 3]
```

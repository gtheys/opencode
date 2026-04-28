<!-- AIDEV-NOTE: HumanLayer workflow skill. Transformed from coding/agent/code-base-analysis.md to pi SKILL.md format. -->
---
name: ralph-research
description: Research a Jira ticket and document findings in the codebase. Trigger on /skill:ralph-research <JIRA-ID>. Fetches the ticket, analyzes the codebase, and creates a research document in thoughts/shared/research/.
---

# Ralph Research

Research a Jira ticket by fetching it from Taskwarrior, analyzing the codebase, and documenting findings.

## Trigger

`/skill:ralph-research <JIRA-ID>`

Example: `/skill:ralph-research ENG-1234`

## Workflow

### Step 1: Fetch Ticket from Taskwarrior

Run:
```bash
task jiraid:$1 status:pending export
```

If no ticket found, exit with: "No pending ticket found for $1. Sync bugwarrior and try again."

### Step 2: Read Ticket Details

Read the ticket file linked from the Taskwarrior annotations or the ticket document in `thoughts/shared/tickets/`.

### Step 3: Move Ticket to "Research in Progress"

```bash
task jiraid:$1 modify work_state:research_in_progress
```

### Step 4: Research the Codebase

Run `/skill:research-codebase` to conduct comprehensive codebase research for the ticket topic.

If deeper analysis is needed on specific components, also use:
- `/skill:codebase-analyzer` — Deep-dive into how specific components work
- `/skill:codebase-pattern-finder` — Find existing patterns to model after

**Be specific about directories:**
- If ticket mentions "WUI", specify `humanlayer-wui/`
- If ticket mentions "daemon", specify `hld/`
- If ticket mentions "CLI", specify `hlyr/`
- If ticket mentions "TypeScript SDK", specify `humanlayer-ts/`

### Step 5: Write Research Document

Create a research document at:
```
thoughts/shared/research/YYYY-MM-DD-$1-{description}.md
```

Where:
- `YYYY-MM-DD` is today's date
- `$1` is the Jira ID
- `{description}` is a brief kebab-case description of the topic

Document structure:
```markdown
---
date: [ISO date]
ticket: $1
researcher: [git config user.name]
repository: [from git remote get-url origin]
topic: "[Ticket title]"
tags: [research, $1, relevant-component-names]
status: complete
---

# Research: [Ticket Title]

## Ticket Summary
[What the ticket asks for]

## Current State
[What exists in the codebase]

## Key Findings
### [Component/Area 1]
- Description with file:line references

### [Component/Area 2]
...

## Relevant Files
- `path/to/file.ext:123` — description

## Architecture Notes
[Patterns, conventions, integration points]

## Open Questions
[Areas needing clarification]
```

### Step 6: Move Ticket to "Research in Review"

```bash
task jiraid:$1 modify work_state:research_in_review
```

### Step 7: Report Summary

Present a concise summary of findings to the user with key file references. Include the path to the research document.

## Notes

- Always run fresh research — never rely solely on existing research documents
- Focus on concrete file paths and line numbers
- Document cross-component connections
- Include temporal context (when research was conducted)
- The research document is the source of truth for the planning phase

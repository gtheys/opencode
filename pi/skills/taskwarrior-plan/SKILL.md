---
name: taskwarrior-plan
description: Manage taskwarrior-based tickets — create, update, comment, and follow workflow patterns. Use when the user wants to work with taskwarrior tasks, create tickets, update status, or manage the spec/plan/dev workflow. Trigger on mentions of "taskwarrior", "tw", "ticket", "task", "jira", or workflow state transitions.
---

# Taskwarrior Plan Management

You are tasked with managing taskwarrior-based tickets, including creating tickets from thoughts documents, updating existing tickets, and following the team's specific workflow patterns.

This skill wraps your existing `jira-taskwarrior-workflow` and `taskwarrior` skills. It provides a project-agnostic interface for ticket management via taskwarrior.

## Initial Setup

First, verify that taskwarrior is available:
```bash
which task && task --version
```

If taskwarrior is not available, respond:
```
Taskwarrior is not installed or not in PATH. Please install taskwarrior and configure it before using ticket management.
```

If taskwarrior is available, respond based on the user's request.

## Team Workflow & Status Progression

The team follows a specific workflow to ensure alignment before code implementation:

1. **Triage** → All new tickets start here for initial review
2. **Spec Needed** → More detail is needed - problem to solve and solution outline necessary
3. **Research Needed** → Ticket requires investigation before plan can be written
4. **Research in Progress** → Active research/investigation underway
5. **Research in Review** → Research findings under review (optional step)
6. **Ready for Plan** → Research complete, ticket needs an implementation plan
7. **Plan in Progress** → Actively writing the implementation plan
8. **Plan in Review** → Plan is written and under discussion
9. **Ready for Dev** → Plan approved, ready for implementation
10. **In Dev** → Active development
11. **Code Review** → PR submitted

## Workflow Commands

### For general requests:
```
I can help you with taskwarrior tickets. What would you like to do?
1. Create a new ticket from a thoughts document
2. Add a comment to a ticket
3. Search for tickets
4. Update ticket status or details
5. Run `/skill:jira-taskwarrior-workflow` for the full spec → tasks → implement pipeline
```

### For specific create requests:
```
I'll help you create a taskwarrior ticket from your thoughts document. Please provide:
1. The path to the thoughts document (or topic to search for)
2. Any specific focus or angle for the ticket (optional)
```

Then wait for the user's input.

## Ticket Creation from Thoughts

When creating a ticket from a thoughts document:

1. **Read the thoughts document** fully
2. **Extract key information**:
   - Problem to solve
   - Proposed solution
   - Acceptance criteria
   - Related files or components

3. **Create taskwarrior task**:
   ```bash
   task add "[Ticket Title]" project:eng priority:H
   task <uuid> annotate "Problem: [problem summary]"
   task <uuid> annotate "Solution: [solution summary]"
   task <uuid> annotate "Source: [path to thoughts document]"
   ```

4. **Set initial status**:
   ```bash
   task <uuid> modify work_state:todo
   ```

5. **Report the created ticket**:
   ```
   Created ticket [ID]: [Title]
   Status: [Initial status]
   Source: [Thoughts document path]
   ```

## Status Management

### Moving tickets through the workflow:

```bash
# Move to research needed
task <uuid> modify work_state:research_needed

# Move to research in progress
task <uuid> modify work_state:research_inprogress

# Move to ready for plan
task <uuid> modify work_state:ready_for_plan

# Move to plan in progress
task <uuid> modify work_state:plan_inprogress

# Move to ready for dev
task <uuid> modify work_state:ready_for_dev

# Move to in dev
task <uuid> modify work_state:in_dev

# Move to code review
task <uuid> modify work_state:code_review
```

### Finding tickets by status:

```bash
# All pending tickets
task status:pending list

# Tickets in specific state
task work_state:research_needed list
task work_state:ready_for_dev list

# High priority tickets
task priority:H status:pending list

# Tickets for a specific project
task project:eng status:pending list
```

## Query Patterns

### Finding the highest priority ticket:
```bash
task status:pending priority:H list
task status:pending priority:M list
```

### Finding tickets ready for next stage:
```bash
# Ready for research
task work_state:research_needed status:pending list

# Ready for plan
task work_state:ready_for_plan status:pending list

# Ready for dev
task work_state:ready_for_dev status:pending list
```

### Finding tickets by tag:
```bash
task +spec list
task +impl list
task +jira list
```

## Integration with Other Skills

This skill works with:
- `/skill:jira-taskwarrior-workflow` — Full spec → tasks → implement pipeline
- `/skill:taskwarrior` — Reference for query patterns and state management
- `/skill:create-plan` — When a ticket is ready for planning
- `/skill:research-codebase` — When a ticket needs research
- `/skill:implement-plan` — When a ticket is ready for development

## Important Guidelines

1. **Always use taskwarrior for state tracking** — Don't maintain state in conversation
2. **Annotate with context** — Always link back to source documents
3. **Be specific about status** — Use the full workflow states, not just pending/done
4. **Sync with thoughts** — When tickets are created or updated, ensure `humanlayer thoughts sync` is run if applicable
5. **Respect the workflow** — Don't skip stages without good reason

## Quick Reference

```bash
# Create ticket
task add "Title" project:eng priority:H
task <uuid> annotate "Details..."

# Update status
task <uuid> modify work_state:ready_for_dev

# Add comment
task <uuid> annotate "Comment text..."

# Find tickets
task status:pending list
task work_state:ready_for_plan list
task project:eng priority:H list

# Complete ticket
task <uuid> done
```

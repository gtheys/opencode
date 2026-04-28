<!-- AIDEV-NOTE: HumanLayer workflow skill. Transformed from coding/agent/create-tasks.md and coding/commands/createtasks.md to pi SKILL.md format. -->
---
name: ralph-plan
description: Create an implementation plan from a researched Jira ticket. Trigger on /skill:ralph-plan <JIRA-ID>. Reads research, analyzes codebase, creates a plan in thoughts/shared/plans/.
---

# Ralph Plan

Create a detailed implementation plan from an approved/researched Jira ticket.

## Trigger

`/skill:ralph-plan <JIRA-ID>`

Example: `/skill:ralph-plan ENG-1234`

## Workflow

### Step 1: Fetch Ticket from Taskwarrior

Run:
```bash
task jiraid:$1 status:pending export
```

Verify the ticket is in "research in review" or later state. If still in "research needed", exit with: "Ticket needs research first. Run: /skill:ralph-research $1"

### Step 2: Read Research Document

Find and read the research document at `thoughts/shared/research/YYYY-MM-DD-$1-*.md`.

If no research found, exit with: "No research found for $1. Run: /skill:ralph-research $1"

### Step 3: Move Ticket to "Plan in Progress"

```bash
task jiraid:$1 modify work_state:plan_in_progress
```

### Step 4: Analyze Codebase for Implementation

Use skills to find implementation patterns:

- `/skill:codebase-pattern-finder` — Find similar implementations to model after
- `/skill:codebase-analyzer` — Understand integration points
- `/skill:thoughts-locator` — Find related plans or decisions

### Step 5: Present Plan Outline

Propose an implementation plan structure:

```
Here's my proposed plan structure:

## Overview
[1-2 sentence summary]

## Implementation Phases:
1. [Phase name] — [what it accomplishes]
2. [Phase name] — [what it accomplishes]
3. [Phase name] — [what it accomplishes]

Does this phasing make sense?
```

Get user feedback and iterate on the structure before writing details.

### Step 6: Write Detailed Plan

Create the plan at:
```
thoughts/shared/plans/YYYY-MM-DD-$1-{description}.md
```

Use this template:

```markdown
# [Feature Name] Implementation Plan

## Overview
[Brief description of what we're implementing and why]

## Current State Analysis
[What exists now, key constraints from research]

## Desired End State
[Specification of the desired end state after this plan is complete]

## What We're NOT Doing
[Explicitly list out-of-scope items]

## Implementation Approach
[High-level strategy and reasoning]

## Phase 1: [Descriptive Name]

### Overview
[What this phase accomplishes]

### Changes Required:

#### 1. [Component/File Group]
**File**: `path/to/file.ext`
**Changes**: [Summary of changes]

### Success Criteria:

#### Automated Verification:
- [ ] Build passes: `make build`
- [ ] Tests pass: `make test`
- [ ] Linting passes: `make lint`

#### Manual Verification:
- [ ] Feature works as expected
- [ ] No regressions in related features

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to the next phase.

---

## Phase 2: [Descriptive Name]
[Similar structure...]

## Testing Strategy

### Unit Tests:
- [What to test]

### Integration Tests:
- [End-to-end scenarios]

### Manual Testing Steps:
1. [Specific step]
2. [Another step]

## Performance Considerations
[Any performance implications]

## Migration Notes
[If applicable]

## References
- Research: `thoughts/shared/research/YYYY-MM-DD-$1-*.md`
```

### Step 7: Move Ticket to "Plan in Review"

```bash
task jiraid:$1 modify work_state:plan_in_review
```

### Step 8: Present Draft Plan

Show the plan location and ask for feedback:
```
I've created the implementation plan at:
thoughts/shared/plans/YYYY-MM-DD-$1-{description}.md

Please review:
- Are the phases properly scoped?
- Are the success criteria specific enough?
- Any technical details that need adjustment?
- Missing edge cases or considerations?
```

Iterate based on feedback.

## Guidelines

1. **Be Skeptical** — Question vague requirements, identify issues early
2. **Be Interactive** — Don't write the full plan in one shot; get buy-in at each step
3. **Be Thorough** — Include specific file paths and line numbers from research
4. **Be Practical** — Focus on incremental, testable changes
5. **No Open Questions in Final Plan** — Every decision must be made before finalizing
6. **Separate Success Criteria**:
   - **Automated Verification**: Commands that can be run (`make test`, etc.)
   - **Manual Verification**: Requires human testing (UI/UX, performance, edge cases)

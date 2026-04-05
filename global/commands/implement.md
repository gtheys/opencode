---
description: Implement tasks from an approved Jira spec
agent: build
---

# Implement Jira Tasks

Execute implementation tasks for a Jira issue sequentially, following an approved specification. This workflow is **resumable** - you can pause at any checkpoint and continue later.

## Prerequisites

**Load the `taskwarrior` skill** for query patterns and state management:

```
skill({ name: "taskwarrior" })
```

## Input

- **$1**: Jira ID (e.g., "IMP-7070")

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STATE FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SPEC                                                                        │
│  ────                                                                        │
│  draft ──────────────────────► approved                                      │
│           (manual approval)                                                  │
│                                                                              │
│                                                                              │
│  PHASE                                                                       │
│  ─────                                                                       │
│                   ┌──────────────────────────────────────────┐               │
│                   │                                          │               │
│                   ▼                                          │               │
│  pending ──► inprogress ──► review ──► approved ─────────────┘               │
│    │            │             │           │        (next phase)              │
│    │            │             │           │                                  │
│    │         [start]      [all tasks  [after /test                           │
│    │                       done]       + /git]                               │
│    │                                                                         │
│    └── status:pending      status:pending    status:completed                │
│        work_state:todo     work_state:*      work_state:approved             │
│                                                                              │
│                                                                              │
│  TASK                                                                        │
│  ────                                                                        │
│                                                                              │
│  pending ─────────────────────► completed                                    │
│  work_state:todo                work_state:done                              │
│       │                              │                                       │
│       │                              │                                       │
│       └── [implement] ──────────────►┘                                       │
│                                                                              │
│           COMMANDS:                                                          │
│           1. task <uuid> done                                                │
│           2. task <uuid> modify work_state:done                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Mandatory State Transitions

### When Starting a Phase

```bash
# ACTION REQUIRED: Mark phase as in-progress
task <phase-uuid> modify work_state:inprogress
```

### When Completing a Task

```bash
# ACTION REQUIRED: Run BOTH commands
task <task-uuid> done
task <task-uuid> modify work_state:done
```

### When All Tasks in Phase Complete

```bash
# ACTION REQUIRED: Mark phase for review
task <phase-uuid> modify work_state:review
```

### After /test and /git Pass

```bash
# ACTION REQUIRED: Approve the phase
task <phase-uuid> modify work_state:approved
```

---

## Workflow

### Step 1: Validate Spec

**Query:** `task jiraid:$1 +spec export`

| Condition | Action |
|-----------|--------|
| No spec found | EXIT: "No spec task found. Create with: `/specjira $1`" |
| `work_state` != `approved` | EXIT: "Spec not approved. Approve with: `task jiraid:$1 +spec modify work_state:approved`" |
| `work_state` == `approved` | Proceed to Step 2 |

**Note**: Spec validation is independent of Jira task status. Jira tasks are linked via `jiraid` UDA and are informational only.

---

### Step 2: Find Active Phase

Check in priority order:

**2a. Check for in-progress phase:**

```bash
task jiraid:$1 +phase work_state:inprogress export
```

If found → Use this phase, go to Step 3

**2b. Check for phase awaiting review:**

```bash
task jiraid:$1 +phase work_state:review export
```

If found → EXIT: "Phase '<name>' awaiting review. Approve with: `task <uuid> modify work_state:approved`"

**2c. Find first pending phase:**

```bash
task jiraid:$1 +phase status:pending export
```

If none found → EXIT: "No phases found. Run: `/createtasks $1`"

If found → **Execute state transition:**

```
┌─────────────────────────────────────────────────────────────┐
│ ACTION: Start Phase                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   task <phase-uuid> modify work_state:inprogress            │
│                                                             │
│   Report: "Phase '<name>' started (work_state:inprogress)"  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 3: Find READY Task

**Query pending tasks in phase:**

```bash
task jiraid:$1 +impl -phase status:pending depends:<phase-uuid> export
```

Sort by task ID (lowest first). For each task, verify all dependencies are satisfied.

| Condition | Action |
|-----------|--------|
| READY task found | Proceed to Step 4 |
| No pending tasks, all completed | Go to Step 8 (Phase Complete) |
| Tasks blocked | EXIT: "Tasks blocked by dependencies" |

---

### Step 4: Load Spec Content

1. Extract spec path from task annotations (pattern: `Spec(repo=<repo>): <path>`)
2. Resolve full path (check `$LLM_NOTES_ROOT` or use relative to git root)
3. Read and cache spec content for this session

---

### Step 5: Present Task (Checkpoint)

Display:

```
═══════════════════════════════════════════════════════════════
  NEXT TASK TO IMPLEMENT
═══════════════════════════════════════════════════════════════

Jira:       $1
Phase:      <phase-name>
Task:       <task-id> of <total> in phase

───────────────────────────────────────────────────────────────
TITLE
───────────────────────────────────────────────────────────────
<task-description>

───────────────────────────────────────────────────────────────
ACCEPTANCE CRITERIA
───────────────────────────────────────────────────────────────
<extracted-from-task>

───────────────────────────────────────────────────────────────
METADATA
───────────────────────────────────────────────────────────────
Estimated:    <effort>
Spec File:    <path>
Dependencies: <completed-deps or "None">

═══════════════════════════════════════════════════════════════
```

**Ask:** "Ready to implement? (yes/no/edit)"

| Response | Action |
|----------|--------|
| yes | Proceed to Step 6 |
| no | EXIT: "Paused. Resume with: `/implement $1`" |
| edit | Allow modifications, re-display |

---

### Step 6: Implement

Implement the task following the Implementation Protocol below.

---

### Step 7: Complete Task (Checkpoint)

Display completion summary, then ask: "Mark as completed? (yes/no/edit)"

| Response | Action |
|----------|--------|
| yes | **Execute state transition below**, then go to Step 3 |
| no | EXIT: "Task remains pending" |
| edit | Return to Step 6 |

**On "yes" - Execute state transition:**

```
┌─────────────────────────────────────────────────────────────┐
│ ACTION: Complete Task                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Command 1: task <task-uuid> done                          │
│   Command 2: task <task-uuid> modify work_state:done        │
│                                                             │
│   Report: "Task <id> completed"                             │
│           "  ✓ status: completed"                           │
│           "  ✓ work_state: done"                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

After completing, return to **Step 3** to find next READY task.

---

### Step 8: Phase Complete

When Step 3 finds no more pending tasks (all completed):

**Execute state transition:**

```
┌─────────────────────────────────────────────────────────────┐
│ ACTION: Mark Phase for Review                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   task <phase-uuid> modify work_state:review                │
│                                                             │
│   Report: "Phase '<name>' complete (work_state:review)"     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Display:

```
═══════════════════════════════════════════════════════════════
  PHASE COMPLETE - REVIEW REQUIRED
═══════════════════════════════════════════════════════════════

Phase:  <phase-name>
Status: work_state:review

───────────────────────────────────────────────────────────────
REQUIRED: Run tests and commit
───────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════
```

**Ask:** "Run tests now? (yes/no)"

| Response | Action |
|----------|--------|
| yes | Invoke test-agent subagent, proceed to Step 9 |
| no | EXIT: "Phase in review. Run tests, `/git`, then approve." |

---

### Step 9: Run Tests (Subagent)

**Invoke the `test-agent` subagent** to run the test suite:

```
┌─────────────────────────────────────────────────────────────┐
│ ACTION: Run Tests via Subagent                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Invoke: test-agent                                        │
│                                                             │
│   Prompt: "Run the test suite for the changes made in       │
│            phase '<phase-name>' for Jira issue $1.          │
│            Report pass/fail status."                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Result | Action |
|--------|--------|
| Tests pass | Proceed to Step 10 |
| Tests fail | EXIT: "Tests failed. Fix issues and re-run `/implement $1`" |

---

### Step 10: Commit Changes

**Ask:** "Tests passed. Run `/git` to commit? (yes/no)"

| Response | Action |
|----------|--------|
| yes | Run `/git`, proceed to Step 11 |
| no | EXIT: "Tests passed. Run `/git` to commit, then approve phase." |

---

### Step 11: Approve Phase

After `/git` completes successfully:

**Execute state transition:**

```
┌─────────────────────────────────────────────────────────────┐
│ ACTION: Approve Phase                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   task <phase-uuid> done                                    │
│   task <phase-uuid> modify work_state:approved              │
│                                                             │
│   Report: "Phase '<name>' approved"                         │
│           "  ✓ status: completed"                           │
│           "  ✓ work_state: approved"                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 12: Next Phase or Complete

**Check for next pending phase:**

```bash
task jiraid:$1 +phase status:pending export
```

| Condition | Action |
|-----------|--------|
| Next phase found | Ask "Continue with phase '<name>'? (yes/no)" |
| No more phases | Go to Step 13 |

If user says yes → Return to **Step 2**
If user says no → EXIT: "Paused. Resume with: `/implement $1`"

---

### Step 13: All Complete

```
═══════════════════════════════════════════════════════════════
  ALL IMPLEMENTATION COMPLETE
═══════════════════════════════════════════════════════════════

Jira:   $1
Status: All phases approved

───────────────────────────────────────────────────────────────
FINAL STEPS
───────────────────────────────────────────────────────────────

1. Create PR (if applicable)
2. Update Jira ticket status

View completed:
   task jiraid:$1 +impl status:completed list

═══════════════════════════════════════════════════════════════
```

---

## Implementation Protocol

### Pre-Implementation

Before writing code, verify:

- [ ] Spec content loaded (Requirements + Design)
- [ ] Acceptance criteria understood
- [ ] Files to create/modify identified

### Task Type Routing

| Task Contains | Approach |
|---------------|----------|
| "test", "TDD" | **Test-First:** Write failing tests first |
| "Implement", "Create" | **Implementation:** Follow spec design patterns |
| "Integration", "Validate" | **Verification:** Test component interactions |

### Effort Scoping

| Estimate | Expected Scope |
|----------|----------------|
| < 1 hour | Single function, minimal changes |
| 1-3 hours | Single file with tests |
| 3-8 hours | Multiple files, may need clarification |
| > 8 hours | Complex - ask if should be broken down |

### Quality Gates

Before marking complete:

- [ ] Code follows project style (run linter)
- [ ] Error handling implemented
- [ ] Types/JSDoc for public APIs
- [ ] `AIDEV-NOTE` comments for complex logic
- [ ] No hardcoded secrets
- [ ] Changes focused on task scope

---

## Examples

### Example 1: Task Completion

```
Agent:
  [implements task 42]

Mark as completed? (yes/no/edit)
> yes

Agent:
  ✓ task abc123 done
  ✓ task abc123 modify work_state:done
  
  Task 42 completed
    ✓ status: completed
    ✓ work_state: done

  Checking for next task...
```

### Example 2: Phase Completion Flow

```
Agent:
  ✓ Task 45 completed (last task in phase)
  ✓ No more pending tasks in phase
  
  ✓ task def456 modify work_state:review
  Phase "Testing" complete (work_state:review)

═══════════════════════════════════════════════════════════════
  PHASE COMPLETE - REVIEW REQUIRED
═══════════════════════════════════════════════════════════════

Phase:  Testing
Status: work_state:review

═══════════════════════════════════════════════════════════════

Run tests now? (yes/no)
> yes

Agent:
  Invoking test-agent subagent...
  
  [test-agent runs test suite]
  
  ✓ test-agent: All tests passed (42 passed, 0 failed)

Tests passed. Run /git to commit? (yes/no)
> yes

Agent:
  [runs /git]
  ✓ Changes committed

  ✓ task def456 done
  ✓ task def456 modify work_state:approved
  
  Phase "Testing" approved
    ✓ status: completed
    ✓ work_state: approved

Continue with phase "Core Implementation"? (yes/no)
> yes

Agent:
  ✓ task ghi789 modify work_state:inprogress
  Phase "Core Implementation" started (work_state:inprogress)
  
  Finding next task...
```

### Example 3: Resuming

```
/implement IMP-7070

Agent:
  ✓ Spec approved
  ✓ Found phase with work_state:inprogress: "Testing"
  ✓ Resuming...
  
  Finding next READY task in phase...
```

---

## AIDEV-NOTE: State Transition Summary

Every state change MUST execute the corresponding Taskwarrior command:

| Event | Command(s) |
|-------|------------|
| Start phase | `task <uuid> modify work_state:inprogress` |
| Complete task | `task <uuid> done` + `task <uuid> modify work_state:done` |
| Phase tasks done | `task <uuid> modify work_state:review` |
| After /test + /git | `task <uuid> done` + `task <uuid> modify work_state:approved` |

Never skip these commands. Always report the state change to the user.

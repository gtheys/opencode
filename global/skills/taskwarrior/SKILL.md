---
name: taskwarrior
description: Query patterns, state management, and operations for the Jira-Taskwarrior agentic coding workflow
license: MIT
metadata:
  workflow: jira-taskwarrior
  audience: ai-agents
---

# Taskwarrior Skill

Reference for interacting with Taskwarrior in the agentic coding workflow. This skill covers query patterns, state management, and common operations for specs, phases, and implementation tasks.

## Data Model

### User Defined Attributes (UDAs)

| UDA | Type | Purpose | Example |
|-----|------|---------|---------|
| `jiraid` | string | Links to Jira issue | `jiraid:IMP-7070` |
| `work_state` | string | Workflow state machine | `work_state:approved` |
| `repository` | string | Git repository name | `repository:account-api` |

### Tags

| Tag | Applied To | Purpose |
|-----|------------|---------|
| `+jira` | Jira tasks | Identifies tasks synced from Jira via Bugwarrior |
| `+spec` | Spec tasks | Identifies the specification task for a Jira issue |
| `+phase` | Phase tasks | Groups related implementation work into phases |
| `+impl` | All impl tasks | Identifies implementation tasks (includes phases) |
| `+conditional` | Optional tasks | Tasks that may be skipped based on context |

### Task Hierarchy

```
Jira Issue (+jira, work_state:new)              ← Synced via Bugwarrior
  ↓ (linked via jiraid UDA, NOT depends:)
Spec Task (+spec, jiraid:JIRA-123)              ← Linked via jiraid only
  ↓ (linked via jiraid UDA, NOT depends:)
Phase 1 (+impl +phase, jiraid:JIRA-123)         ← Linked via jiraid only
  ├── Task 1.1 (+impl, depends:phase-uuid)      ← Depends on phase
  ├── Task 1.2 (+impl, depends:phase-uuid)      ← Depends on phase + may depend on 1.1
  └── Task 1.3 (+impl, depends:phase-uuid)      ← Depends on phase + may depend on 1.2
Phase 2 (+impl +phase, jiraid:JIRA-123)         ← Linked via jiraid only
  ├── Task 2.1 (+impl, depends:phase-uuid)      ← Depends on phase
  └── Task 2.2 (+impl, depends:phase-uuid)      ← Depends on phase + may depend on 2.1
```

**Important**: Jira tasks, specs, and phases are linked via `jiraid` UDA, NOT via `depends:` field. Only implementation tasks use `depends:` for their phase and inter-task dependencies.

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STATE FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  JIRA TASK (work_state + status)                                            │
│  ─────────                                                                   │
│  ┌────────────┐                                                              │
│  │    new     │  (Informational only - never blocks implementation)         │
│  │  pending   │  Synced from Jira via Bugwarrior                            │
│  └────────────┘  Linked to specs/phases/tasks via jiraid UDA                │
│                                                                              │
│                                                                              │
│  SPEC                                                                        │
│  ────                                                                        │
│  draft ──────────────────────► approved                                      │
│           (manual approval)                                                  │
│                                                                              │
│                                                                              │
│  PHASE (work_state + status)                                                 │
│  ─────                                                                       │
│                                                                              │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐       │
│  │   todo     │───►│ inprogress │───►│   review   │───►│  approved  │       │
│  │  pending   │    │  pending   │    │  pending   │    │ completed  │       │
│  └────────────┘    └────────────┘    └────────────┘    └────────────┘       │
│        │                 │                 │                 │               │
│        │            [Step 2]          [Step 8]          [Step 11]            │
│        │           start phase      all tasks done    after /test            │
│        │                                                + /git               │
│                                                                              │
│                                                                              │
│  TASK (work_state + status)                                                  │
│  ────                                                                        │
│                                                                              │
│  ┌────────────┐                              ┌────────────┐                  │
│  │    todo    │─────────────────────────────►│    done    │                  │
│  │  pending   │                              │ completed  │                  │
│  └────────────┘                              └────────────┘                  │
│        │                                           │                         │
│        │                                      [Step 7]                       │
│        │                                   task completed                    │
│        │                                                                     │
│        │              COMMANDS REQUIRED:                                     │
│        │              1. task <uuid> done                                    │
│        │              2. task <uuid> modify work_state:done                  │
│        │                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## State Machines

### Jira Task States (`work_state` + `status`)

| work_state | status | Meaning | Notes |
|------------|--------|---------|-------|
| `new` | `pending` | Synced from Jira, open | Informational only, never blocks |
| `new` | `completed` | Closed in Jira | Informational only |

**Important**: Jira tasks are managed by Bugwarrior. Never edit manually. They do NOT block implementation work.

### Spec States (`work_state`)

| State | Meaning | Transitions To |
|-------|---------|----------------|
| `draft` | Spec is being written/revised | `approved` |
| `approved` | Spec is finalized, ready for implementation | `draft` (if modified) |

### Phase States (`work_state` + `status`)

| work_state | status | Meaning | Next Transition |
|------------|--------|---------|-----------------|
| `todo` | `pending` | Phase not started | → `inprogress` when starting |
| `inprogress` | `pending` | Actively working on phase | → `review` when all tasks done |
| `review` | `pending` | All tasks complete, awaiting /test + /git | → `approved` after /test + /git |
| `approved` | `completed` | Phase reviewed and approved | (terminal state) |

### Task States (`work_state` + `status`)

| work_state | status | Meaning | Next Transition |
|------------|--------|---------|-----------------|
| `todo` | `pending` | Task not yet started | → `done` when implemented |
| `done` | `completed` | Task finished | (terminal state) |

---

## Mandatory State Transitions

These commands MUST be executed at each workflow step. Never skip these.

### Starting a Phase (Step 2)

```bash
# REQUIRED: Mark phase as in-progress
task <phase-uuid> modify work_state:inprogress
```

**Report:** "Phase '<name>' started (work_state:inprogress)"

### Completing a Task (Step 7)

```bash
# REQUIRED: Run BOTH commands in sequence
task <task-uuid> done
task <task-uuid> modify work_state:done
```

**Report:**
```
Task <id> completed
  ✓ status: completed
  ✓ work_state: done
```

### All Tasks in Phase Done (Step 8)

```bash
# REQUIRED: Mark phase for review
task <phase-uuid> modify work_state:review
```

**Report:** "Phase '<name>' complete (work_state:review)"

### After /test and /git Pass (Step 11)

```bash
# REQUIRED: Run BOTH commands to approve phase
task <phase-uuid> done
task <phase-uuid> modify work_state:approved
```

**Report:**
```
Phase '<name>' approved
  ✓ status: completed
  ✓ work_state: approved
```

---

## Query Patterns

### Finding Tasks

```bash
# Find Jira task (synced from Bugwarrior)
task jiraid:$ID +jira export

# Find spec task for a Jira issue
task jiraid:$ID +spec export

# Find all implementation tasks for a Jira issue
task jiraid:$ID +impl export

# Find all phase tasks
task jiraid:$ID +phase export
```

### Phase Discovery (Priority Order)

```bash
# 1. Check for in-progress phase (resume here)
task jiraid:$ID +phase work_state:inprogress export

# 2. Check for phase awaiting review
task jiraid:$ID +phase work_state:review status:completed export

# 3. Find first pending phase (to start)
task jiraid:$ID +phase status:pending export
```

### Task Discovery Within Phase

```bash
# Find pending tasks in a phase (by phase UUID dependency)
task jiraid:$ID +impl -phase status:pending depends:<phase-uuid> export

# Find completed tasks in a phase
task jiraid:$ID +impl -phase status:completed depends:<phase-uuid> export

# Find all tasks in a phase (any status)
task jiraid:$ID +impl -phase depends:<phase-uuid> export
```

### Dependency Checking

```bash
# Check if a specific dependency is satisfied
task uuid:<dep-uuid> export
# Parse JSON: status == "completed" or status == "deleted" means satisfied

# Find tasks with unsatisfied dependencies
task jiraid:$ID +impl +BLOCKED list
```

### Parsing Export Output

The `export` command returns JSON array. Key fields:

```json
[
  {
    "uuid": "abc123...",
    "id": 42,
    "description": "Task title",
    "status": "pending",
    "depends": ["uuid1", "uuid2"],
    "tags": ["impl"],
    "work_state": "todo",
    "jiraid": "IMP-7070",
    "annotations": [
      {"description": "Spec(repo=account-api): notes/specs/IMP-7070.md"}
    ]
  }
]
```

---

## Common Operations

### Start Phase (work_state: todo → inprogress)

```bash
task <phase-uuid> modify work_state:inprogress
```

### Complete Task (status: pending → completed, work_state: todo → done)

```bash
# BOTH commands required - do not skip either one
task <task-uuid> done
task <task-uuid> modify work_state:done
```

### Mark Phase for Review (work_state: inprogress → review)

```bash
task <phase-uuid> modify work_state:review
```

### Approve Phase (status: pending → completed, work_state: review → approved)

```bash
# BOTH commands required - do not skip either one
task <phase-uuid> done
task <phase-uuid> modify work_state:approved
```

### Create a Phase Task

```bash
task add "<phase-number>. Phase: <phase-name>" \
  project:<JIRAKEY> \
  jiraid:<JIRAKEY> \
  repository:<repo> \
  work_state:todo \
  +impl +phase
```

**Note**: Phase is linked to Jira via `jiraid` UDA, NOT via `depends:` field.

### Create an Implementation Task

```bash
task add "<task-id>. <task-title>" \
  project:<JIRAKEY>.<phase-slug> \
  jiraid:<JIRAKEY> \
  repository:<repo> \
  work_state:todo \
  +impl \
  depends:<phase-uuid>[,<other-task-uuids>]
```

### Add Annotation

```bash
task <task-uuid> annotate "Spec(repo=<repo>): <path>"
```

### Get Task UUID from ID

```bash
task <id> _get uuid
```

---

## Checking if a Task is READY

A task is READY when ALL its dependencies are satisfied (completed or deleted).

**Algorithm:**

1. Get the task's `depends` field (array of UUIDs)
2. For each dependency UUID:
   ```bash
   task uuid:<dep-uuid> export
   ```
3. Parse JSON, check `status` field
4. If `status` is `completed` or `deleted` → dependency satisfied
5. If ALL dependencies satisfied → task is READY

**Shortcut using Taskwarrior virtual tag:**

```bash
# List all ready tasks (no blocked dependencies)
task jiraid:$ID +impl +READY list

# Export ready tasks
task jiraid:$ID +impl +READY export
```

---

## Extracting Spec File Path

Spec file location is stored in task annotations. Parse with these patterns:

| Pattern | Example |
|---------|---------|
| `Spec(repo=<repo>): <path>` | `Spec(repo=account-api): notes/specs/IMP-7070.md` |
| `Spec: <path>` | `Spec: notes/specs/IMP-7070.md` |

**Resolution:**

1. If `$LLM_NOTES_ROOT` is set: `$LLM_NOTES_ROOT/<path>`
2. Otherwise: `<path>` relative to git root

---

## Error Patterns and Recovery

| Error | Cause | Recovery Command |
|-------|-------|------------------|
| No spec task found | Spec not created | `/specjira $ID` |
| Spec not approved | `work_state` != `approved` | `task jiraid:$ID +spec modify work_state:approved` |
| No phases found | Tasks not generated | `/createtasks $ID` |
| Phase in review | Needs approval | `task <phase-uuid> modify work_state:approved` |
| All tasks blocked | Circular or missing deps | `task jiraid:$ID +impl +BLOCKED list` |

---

## Viewing Task Hierarchy

```bash
# Tree view of all tasks under a Jira issue
task project:<JIRAKEY> tree

# List view with dependencies
task jiraid:$ID +impl list

# Detailed info for a specific task
task <uuid> info
```

---

## AIDEV-NOTE: Workflow Integration

This skill is used by:

- `/specjira` - Creates spec tasks
- `/createtasks` - Creates phase and implementation tasks  
- `/implement` - Executes implementation tasks sequentially

### Critical: Two-Field State Tracking

Both `status` (Taskwarrior native) and `work_state` (UDA) must be updated:

| Entity | status command | work_state command |
|--------|----------------|-------------------|
| Task complete | `task <uuid> done` | `task <uuid> modify work_state:done` |
| Phase approve | `task <uuid> done` | `task <uuid> modify work_state:approved` |

**Never skip either command.** The workflow depends on both fields being correct.

### State Transition Summary

| Event | Commands (in order) |
|-------|---------------------|
| Start phase | `modify work_state:inprogress` |
| Complete task | `done` then `modify work_state:done` |
| Phase tasks done | `modify work_state:review` |
| Approve phase | `done` then `modify work_state:approved` |

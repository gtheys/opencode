---
name: jira-taskwarrior-workflow
description: >
  Jira-to-implementation workflow using Taskwarrior. Use when the user wants to:
  create a spec from a Jira issue, generate implementation tasks from a spec,
  execute implementation tasks sequentially, work with Jira issues via Taskwarrior,
  or manage the spec → tasks → implement pipeline. Trigger on mentions of
  "specjira", "createtasks", "implement", "jira spec", "taskwarrior jira",
  or any Jira ID (e.g., "IN-1373", "IMP-7070") combined with spec/task work.
---

# Jira-Taskwarrior Workflow

This skill manages the full lifecycle from Jira issue → specification → implementation tasks → execution using Taskwarrior.

## Data Model

### UDAs (User Defined Attributes)

| UDA | Type | Purpose | Example |
|-----|------|---------|---------|
| `jiraid` | string | Links to Jira issue | `jiraid:IMP-7070` |
| `work_state` | string | Workflow state machine | `work_state:approved` |
| `repository` | string | Git repository name | `repository:account-api` |

### Tags

| Tag | Applied To | Purpose |
|-----|------------|---------|
| `+jira` | Jira tasks | Synced from Jira via Bugwarrior |
| `+spec` | Spec tasks | The specification task for a Jira issue |
| `+phase` | Phase tasks | Groups related implementation work |
| `+impl` | All impl tasks | Implementation tasks (includes phases) |
| `+e2e` | E2E test tasks | End-to-end test tasks |
| `+conditional` | Optional tasks | May be skipped based on context |

### Task Hierarchy

```
Jira Issue (+jira)
  ↓ (linked via jiraid UDA)
Spec Task (+spec)
  ↓ (linked via jiraid UDA)
Phase 1 (+impl +phase)
  ├── Task 1.1 (+impl, depends:phase-uuid)
  ├── Task 1.2 (+impl, depends:phase-uuid)
  └── Task 1.3 (+impl, depends:phase-uuid)
Phase 2 (+impl +phase)
  ├── Task 2.1 (+impl, depends:phase-uuid)
  └── Task 2.2 (+impl, depends:phase-uuid)
```

**Important**: Jira tasks, specs, and phases are linked via `jiraid` UDA, NOT via `depends:`. Only implementation tasks use `depends:` for their phase and inter-task dependencies.

---

## Phase 1: Create Spec from Jira (`specjira`)

Use when the user says "create spec for JIRA-123", "specjira IN-1373", or similar.

### Steps

1. **Extract Jira ID** from user input (e.g., "IN-1373", "IMP-7070")

2. **Query Taskwarrior for the Jira task**:
   ```bash
   task jiraid:$ID status:pending export
   ```
   - If no task found: suggest `bugwarrior-pull` and exit
   - Parse JSON for: `jiraid`, `jirasummary`, `jiradescription`, `uuid`, `jiraurl`

3. **Determine spec file location**:
   - Get repo name: `git remote get-url origin` (extract last segment before .git)
   - If `$LLM_NOTES_ROOT` set: `$LLM_NOTES_ROOT/<repo>/notes/specs/<JIRAKEY>__<slug>.md`
   - Otherwise: `notes/specs/<JIRAKEY>__<slug>.md` relative to git root
   - Slug: lowercase `jirasummary`, spaces → dashes, max 5 words

4. **Create spec file** with structure:
   ```markdown
   ---
   createdAt: <ISO8601>
   work_state: draft
   ---

   # <Title from jirasummary>

   ## Requirements

   ### 1. <Story title>
   <User story from jiradescription>

   - **1.1. Acceptance criterion**
   - **1.2. Acceptance criterion**
   - **1.3. Unit & integration tests**

   ### 2. <Next story>
   ...

   ### N. E2E tests
   <End-to-end test story>

   ## Design

   ### Files
   #### New
   - `src/...` - description
   #### Changed
   - `src/...` - description

   ### Data Models
   ### Component Graph
   ### Testing Strategy
   ### Error Handling
   ```

5. **Create Taskwarrior spec task**:
   ```bash
   task add "SPEC: $JIRAKEY $summary" +spec work_state:draft jiraid:$JIRAKEY
   task <spec-uuid> annotate "Spec(repo=<repo>): <repo>/notes/specs/<filename>"
   ```

6. **Report**: Spec file path, spec task UUID, work_state (draft), Jira URL

7. **After user reviews Requirements**, ask to proceed to Design section

8. **After user approves completed spec**:
   ```bash
   task <spec-uuid> modify work_state:approved
   task <spec-uuid> annotate "Approved on <ISO8601 date>"
   ```
   Update spec file YAML: add `approvedAt: <ISO8601>`

---

## Phase 2: Create Implementation Tasks (`createtasks`)

Use when the user says "createtasks JIRA-123", "create tasks for IN-1373", or similar.

### Prerequisites
- Spec task exists with `work_state:approved`

### Steps

1. **Validate spec**:
   ```bash
   task jiraid:$ID +spec export
   ```
   - If not found → "No spec task found. Create with specjira $ID"
   - If `work_state` != `approved` → warn, ask to continue

2. **Read spec file** (path from spec task annotations)

3. **Analyze spec** to extract:
   - Requirements stories (each becomes an implementation task)
   - Design: files, data models, component graph
   - Final story is always E2E tests → separate task/phase

4. **Generate implementation plan**:
   - Phase: Setup/Preparation (if needed)
   - Phase: Data models/Types
   - Phase: Core implementation (one task per story, tests bundled)
   - Phase: E2E testing (separate, depends on all core tasks)

5. **Determine repo name**: `git remote get-url origin`

6. **Check for existing tasks**:
   ```bash
   task jiraid:$ID +impl export
   ```
   - If exists → ask to delete and recreate

7. **Present plan** to user for approval

8. **Create phase tasks**:
   ```bash
   task add "<n>. Phase: <name>" project:<JIRAKEY> jiraid:<JIRAKEY> repository:<repo> work_state:todo +impl +phase
   ```

9. **Create implementation tasks**:
   ```bash
   task add "<id>. <title>" project:<JIRAKEY>.<phase-slug> jiraid:<JIRAKEY> repository:<repo> work_state:todo +impl depends:<phase-uuid>[,<task-uuids>]
   task <task-id> modify -- "<full description with acceptance criteria>"
   task <task-uuid> annotate "Spec(repo=<repo>): <path>"
   ```

---

## Phase 3: Implement Tasks (`implement`)

Use when the user says "implement JIRA-123", "start Jira IN-1373", or similar.

### State Flow

```
Phase:  pending(todo) → inprogress → review → approved(completed)
Task:   pending(todo) → completed(done)
```

### Steps

1. **Validate spec**: `task jiraid:$ID +spec export` — must be `approved`

2. **Find active phase** (in priority order):
   ```bash
   task jiraid:$ID +phase work_state:inprogress export   # resume
   task jiraid:$ID +phase work_state:review export       # needs approval
   task jiraid:$ID +phase status:pending export          # start new
   ```

3. **Start phase** (if new):
   ```bash
   task <phase-uuid> modify work_state:inprogress
   ```

4. **Find READY task**:
   ```bash
   task jiraid:$ID +impl -phase status:pending depends:<phase-uuid> export
   ```
   Sort by task ID. Check all dependencies satisfied (status: completed or deleted).

5. **Present task** to user with:
   - Jira ID, phase name, task number
   - Title, description, acceptance criteria
   - Estimated effort, spec file, dependencies

6. **Ask**: "Ready to implement? (yes/no)"
   - If no → "Paused. Resume with: implement $ID"

7. **Implement** the task following spec

8. **Complete task**:
   ```bash
   task <task-uuid> done
   task <task-uuid> modify work_state:done
   ```
   Return to Step 4 for next task

9. **Phase complete** (no more pending tasks):
   ```bash
   task <phase-uuid> modify work_state:review
   ```
   Ask user to run tests and commit

10. **After tests pass and commit done**:
    ```bash
    task <phase-uuid> done
    task <phase-uuid> modify work_state:approved
    ```
    Check for next pending phase → return to Step 2

---

## Mandatory State Transitions

| Event | Commands |
|-------|----------|
| Start phase | `task <uuid> modify work_state:inprogress` |
| Complete task | `task <uuid> done` then `task <uuid> modify work_state:done` |
| Phase tasks done | `task <uuid> modify work_state:review` |
| Approve phase | `task <uuid> done` then `task <uuid> modify work_state:approved` |

**Never skip either command.** Both `status` and `work_state` must be updated.

---

## Query Patterns

```bash
# Find spec
task jiraid:$ID +spec export

# Find phases
task jiraid:$ID +phase export
task jiraid:$ID +phase work_state:inprogress export

# Find tasks in phase
task jiraid:$ID +impl -phase status:pending depends:<phase-uuid> export

# Ready tasks shortcut
task jiraid:$ID +impl +READY export

# Tree view
task project:$JIRAKEY tree
```

---

## Spec File Path Resolution

From task annotations, parse pattern: `Spec(repo=<repo>): <path>`
- If `$LLM_NOTES_ROOT` set: `$LLM_NOTES_ROOT/<path>`
- Otherwise: `<path>` relative to git root

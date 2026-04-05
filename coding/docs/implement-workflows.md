# Implementation Workflows & State Changes

Documentation of workflows and state transitions for the `/implement` command.

## Understanding the Dual Status System

This workflow uses two separate status tracking systems:

### 1. Taskwarrior Status (`status`)
- **Native Taskwarrior field**
- Controls whether tasks are actionable/visible in active lists
- Values: `pending`, `completed`, `deleted`
- Implementation tasks are marked `status:completed` when done
- **Purpose**: Taskwarrior lifecycle management

### 2. Custom Work State (`work_state`)
- **Custom UDA field** added to Taskwarrior
- Tracks workflow-specific progress
- Values vary by entity (spec, phase, task)
- **Purpose**: Implementation workflow tracking

### Why Two Systems?

Taskwarrior's `status` is too coarse-grained for our workflow. We need:
- Distinguish "pending" from "ready to implement"
- Track phases as "in progress" vs "in review"
- Maintain approval states for specs and phases

The custom `work_state` provides this granularity without breaking Taskwarrior's native behavior.

**Example**: A completed implementation task has `status:completed` (taskwarrior lifecycle) AND `work_state:done` (workflow tracking).

## 1. Overall Implementation Workflow

**Note**: Jira tasks provide context but do NOT block implementation. Tasks are linked via `jiraid` UDA.

```mermaid
flowchart TD
    Start[/Implement JIRA Task ID/] --> ValidateSpec
    ValidateSpec{Spec Approved?}
    ValidateSpec -->|No| Error1[X Spec not approved]
    ValidateSpec -->|Yes| FindPhase

    FindPhase{Phase in progress?}
    FindPhase -->|Yes| UsePhase[Use in-progress phase]
    FindPhase -->|No| CheckReview{Phase in review?}
    CheckReview -->|Yes| Error2[WARNING Phase needs approval]
    CheckReview -->|No| StartPhase[Start first pending phase]

    UsePhase --> CheckTasks
    StartPhase --> CheckTasks
    CheckTasks{Pending tasks in phase?}
    CheckTasks -->|No| CheckCompleted{All tasks completed?}
    CheckCompleted -->|Yes| SetReview[Set phase to review]
    CheckCompleted -->|No| Error3[WARNING No pending tasks]
    CheckTasks -->|Yes| FindReady

    FindReady{Find READY task}
    FindReady -->|None found| Error4[WARNING No ready tasks]
    FindReady -->|Found| PresentTask

    PresentTask[Present task to user] --> UserConfirm{Ready?}
    UserConfirm -->|No| Cancel[Exit gracefully]
    UserConfirm -->|Yes| Implement[Implement task]

    Implement --> Report[Report changes]
    Report --> MarkDone{Mark done?}
    MarkDone -->|Yes| Complete[Task marked done]
    MarkDone -->|No| KeepPending

    Complete --> CheckMore{More tasks in phase?}
    KeepPending --> CheckMore

    CheckMore -->|Yes| FindReady
    CheckMore -->|No| PhaseComplete{Phase complete?}
    PhaseComplete -->|Yes| SetReview
    PhaseComplete -->|No| Blocked[WARNING Tasks blocked]

    SetReview --> RunTest[Run /test]
    RunTest --> TestPass{Tests pass?}
    TestPass -->|Yes| RunGit[Run /git]
    TestPass -->|No| FixTests[Fix and retry]
    FixTests --> RunTest

    RunGit --> MorePhases{More phases?}
    MorePhases -->|Yes| FindPhase
    MorePhases -->|No| Success[SUCCESS All complete]
```

## 2. Phase State Transitions

```mermaid
stateDiagram-v2
    [*] --> Pending: Phase created

    Pending --> InProgress: /implement starts phase
    note right of Pending
        status: pending
        work_state: pending
        Phase is waiting to start
        Lowest task ID phase selected
    end note

    InProgress --> Review: All tasks completed
    note right of InProgress
        status: pending
        work_state: inprogress
        Active phase being worked on
        Resumable if interrupted
    end note

    Review --> Approved: Human approves phase
    note right of Review
        status: pending
        work_state: review
        All tasks in phase complete
        Waiting for human review
    end note

    Approved --> [*]

    note right of Approved
        status: pending
        work_state: approved
        Phase fully completed and approved
        Can proceed to next phase
    end note
```

## 3. Implementation Task State Transitions

```mermaid
stateDiagram-v2
    [*] --> Pending: Task created via /createtasks

    Pending --> Ready: All dependencies completed
    note right of Pending
        status: pending
        work_state: todo
        Waiting for dependencies
        Not yet eligible for implementation
    end note

    Ready --> Completed: /implement completes task
    note right of Ready
        status: completed
        work_state: todo
        All dependencies satisfied
        Can be implemented next
    end note

    Completed --> Done: /implement marks done
    note right of Done
        status: completed
        work_state: done
        Task is complete
    end note

    Done --> [*]
```

## 4. Task Selection Logic (READY Task Detection)

```mermaid
flowchart TD
    Start[Get pending tasks in phase] --> Sort[Tasks sorted by ID]
    Sort --> Loop{Any tasks left?}
    Loop -->|No| None[No READY tasks]
    Loop -->|Yes| GetDeps[Get task dependencies]

    GetDeps --> CheckDeps{All deps completed?}
    CheckDeps -->|No| NextTask[Move to next task]
    CheckDeps -->|Yes| Ready[Task is READY]

    NextTask --> Loop
    Ready --> Output[Select this task]
```

## 5. Phase Completion & Transition Flow

```mermaid
flowchart TD
    Start[Task completed] --> CheckPending{Pending tasks left?}
    CheckPending -->|Yes| Continue[Continue in current phase]
    CheckPending -->|No| SetReview[Set work_state=review]

    SetReview --> ReportPhase[Report phase complete]
    ReportPhase --> RunTest[Run /test]
    RunTest --> TestPass{Tests pass?}
    TestPass -->|Yes| RunGit[Run /git]
    TestPass -->|No| Fix[Fix tests and retry]
    Fix --> RunTest

    RunGit --> FindNext{Find next phase}

    FindNext -->|Found| DisplayNext[Show next phase]
    DisplayNext --> UserChoice{Continue?}
    UserChoice -->|No| Pause[Pause session]
    UserChoice -->|Yes| StartNext[Start next phase]

    FindNext -->|None| AllComplete[All phases complete]

    AllComplete --> FinalReport[SUCCESS Final report]
```

## 6. Spec Caching & Resumption Flow

```mermaid
flowchart LR
    Start[Session starts] --> CheckCache{Spec cached?}
    CheckCache -->|Yes| UseCache[Use cached spec]
    CheckCache -->|No| ReadSpec[Read spec from disk]
    ReadSpec --> CacheSpec[Cache in memory]
    CacheSpec --> Task1[Task 1 implementation]
    UseCache --> Task1

    Task1 --> TaskN[Task N implementation]
    TaskN --> SessionEnd[Session ends]

    SessionEnd --> NewSession{Resumed later?}
    NewSession -->|Yes| CheckCache
    NewSession -->|No| End[End]
```

## State Field Reference

### Taskwarrior Status (Native Field)
Taskwarrior's built-in `status` field tracks task lifecycle. Only `pending` tasks are actionable.

| Value | Meaning | When Set |
|-------|---------|---------|
| `pending` | Task is waiting to be worked on | Default when created |
| `completed` | Task is finished | Set by `task done` command |
| `deleted` | Task was deleted | Set by `task delete` command |

### Custom Work State (UDA Field)
Custom `work_state` UDA tracks workflow-specific progress.

| Entity | Field | Values | Purpose |
|--------|-------|--------|---------|
| Jira Task | `work_state` | `new` | Synced from Jira via Bugwarrior (informational only, never blocks) |
| Spec | `work_state` | `approved` | Must be approved before implementation |
| Phase | `work_state` | `pending`, `inprogress`, `review`, `approved` | Tracks phase lifecycle through implementation workflow |
| Phase | `status` (taskwarrior) | `pending` | Phases remain pending throughout lifecycle |
| Task | `work_state` | `todo`, `done` | Implementation progress tracking |

### Key Differences

| Aspect | taskwarrior `status` | `work_state` |
|--------|---------------------|---------------|
| **Type** | Native field | Custom UDA |
| **Scope** | All Taskwarrior tasks | Implementation workflow only |
| **Lifecycle** | pending → completed/deleted | todo → done (tasks)<br/>pending → inprogress → review → approved (phases) |
| **Primary Use** | Filter actionable tasks | Track workflow progress |

## Key Workflow Rules

1. **Jira tasks are context only** - Linked via `jiraid` UDA, never via `depends:` field
2. **Spec must be approved** (`work_state:approved`) before any implementation
3. **Specs don't depend on Jira tasks** - Can be created/approved independently
4. **Phases don't depend on specs** - Linked via `jiraid` UDA only
5. **Phases are sequential** - complete one before starting next
6. **Tasks within phase** follow dependency order
7. **Only READY tasks** (all deps completed, taskwarrior `status:pending`) can be implemented
8. **Phase auto-transitions** `work_state:review` when all tasks complete
9. **Tests run at phase completion** - `/test` and `/git` only after all tasks in phase are done
10. **Resumption** happens by checking for phase `work_state:inprogress` first
11. **Human approval required** at phase boundaries and task completion
12. **Taskwarrior `status`** controls whether task is actionable (only `pending` tasks appear in active lists)
13. **Custom `work_state`** tracks workflow progress independently of taskwarrior status

## Testing & Commit Flow

Testing and git operations occur at **phase boundaries**, not after each individual task:

```
Task 1 → Task 2 → Task N → Phase Complete → /test → /git → Next Phase
```

**Rationale:**
- Batch testing reduces overhead
- Commit logical groups of related changes
- Easier to revert if needed
- Aligns with phase-based workflow

## Related Documentation

- `/command/implement.md` - Full implementation command specification
- `/command/specjira.md` - Spec creation workflow
- `/command/createtasks.md` - Task generation from spec

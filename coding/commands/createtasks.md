---
description: Create Taskwarrior implementation tasks from an approved spec
agent: create-tasks
---
# Create implementation tasks from spec

Analyze an approved specification and create granular Taskwarrior implementation tasks with proper dependencies based on the Requirements and Design sections.

## Input

- **$ARGUMENTS**: Jira ID (e.g., "IN-1373")

## Steps

1. **Extract Jira ID from arguments**
   - The Jira ID is provided in $1 (e.g., "IN-1373")
   - Extract just the ID
2. **Find the spec task in Taskwarrior**
    - Run: `task jiraid:$1 +spec export`
    - Parse JSON to extract:
      - `uuid` - The spec task UUID
      - `annotations` - Contains spec file location
      - `work_state` - Current approval state
    - Parse spec file path from annotation matching pattern: `Spec(repo=<repo>): <path>`
    - If no spec task found, exit with error: "No spec task found for <JIRAKEY>. Create one with: specjira <JIRAKEY>"
3. **Validate spec is approved**
    - Check `work_state` field
    - If not "approved":
      - Warn user: "⚠️  This spec is not approved (current state: <state>). Creating tasks from unapproved specs may lead to incomplete implementation."
      - Ask: "Continue anyway? (yes/no)"
      - If no: Exit gracefully
    - If approved: Proceed to next step
4. **Read and analyze the spec file**
   - Read the spec markdown file from the extracted path
   - If file not found, exit with error: "Spec file not found: <path>"
   - Extract:
     - **Title** - Feature name from H1 heading
     - **Requirements section** - All user stories and acceptance criteria
     - **Design section** - All components, files, data models, testing strategy
   - Analyze the content to understand:
     - What needs to be built (from Requirements stories)
     - How it should be built (from Design components)
     - What files need to be created/modified (from Design files section)
     - What tests are needed (from each story's test acceptance criteria and from the E2E story)
5. **Generate implementation plan from spec analysis**
   Based on the Requirements and Design, create a task breakdown:

   a. **Understand the test structure in the spec:**
      - Each implementation story includes its own unit and integration test acceptance criteria — these are **not** separate tasks but part of that story's implementation task
      - The final story in Requirements is always an **E2E test story** — this becomes its own dedicated task/phase

   b. **Identify implementation phases** (typical phases):
      - Preparation/Setup (if new infrastructure needed)
      - Data models/Types (if new models defined in Design)
      - Core implementation (one task per story, including that story's unit + integration tests)
      - E2E testing (from the final E2E story in Requirements)

   c. **For each implementation story in Requirements**:
      - Create a **single task** that covers: implementation + unit tests + integration tests for that story
      - The story's test acceptance criteria (the "Unit & integration tests" block) become part of the task's acceptance criteria
      - Do **not** create separate test tasks for unit/integration — they are bundled into the implementation task
      - Use TDD approach within the task: the task description should instruct the implementer to write tests first, then implement

   d. **For the E2E test story** (always the last story in Requirements):
      - Create a **separate task or phase** dedicated to E2E tests
      - This task depends on all core implementation tasks being complete

   e. **Determine task dependencies**:
      - Setup/preparation tasks come first
      - Data model tasks before implementation tasks that use them
      - Implementation tasks follow logical ordering (data models → business logic → APIs)
      - E2E test task depends on all implementation tasks
      - Follow component graph from Design for inter-task dependencies

   f. **Example task generation logic**:

      ```
      If Requirements Story 1 says:
        - "Token refresh utility" with acceptance criteria including
          unit/integration tests for refresh logic
      And Design mentions:
        - New file "src/token/TokenRefresher.ts"
        - Test file "test/TokenRefresher.test.ts"
      Then create ONE task:
        - Task: "Implement token refresh utility (Story 1)"
          - Description includes: write tests first, then implement
          - Acceptance: all story ACs pass including unit/integration tests
          - Depends on: data model tasks

      If Requirements final story says:
        - "E2E tests" covering full token lifecycle
      Then create:
        - Task: "E2E tests — token lifecycle (Story N)"
          - Depends on: all implementation tasks
      ```

   g. **Build task structure**:

      ```
      phases: [
        {
          name: "<phase-name>",
          tasks: [
            {
              id: "<sequential-id>",
              title: "<concise-title>",
              description: "<what-to-do>",
              acceptance: "<done-when>",
              estimated: "<time-estimate>",
              dependencies: [<other-task-ids>],
              conditional: false,
              story: "<story-number-from-spec>"
            }
          ]
        }
      ]
      ```

6. **Define project hierarchy and get repository name**
   - Run: `git remote get-url origin`
   - Extract repo name from URL (last segment before .git, e.g., "account-api")
   - Store as `<repo>` for the `repository` UDA
   - Use the Jira ID as the base project name:
     - Phase tasks will use: `project:<JIRAKEY>`
     - Implementation tasks will use: `project:<JIRAKEY>.<phase-slug>`
     - Phase slug is derived from phase name (lowercase, spaces to hyphens, e.g., "Data models" → "data-models")

7. **Check for existing implementation tasks**
   - Run: `task jiraid:$ARGUMENTS +impl export`
   - Parse JSON and count results
   - If tasks exist (count > 0):
     - Warn user: "⚠️  Found <count> existing implementation tasks for <JIRAKEY>."
     - Show first 5 task descriptions
     - Ask: "Delete and recreate all tasks? (yes/no)"
     - If yes: Delete existing tasks: `task jiraid:$ARGUMENTS +impl delete` (confirm deletion)
     - If no: Exit gracefully with message: "Cancelled. Existing tasks preserved."

8. **Present implementation plan to user**
   - Show the generated task breakdown:

     ```
     Generated implementation plan from spec analysis:
     
     1. Phase: Data models & types (2 tasks)
       - 1.1. Create TokenStore interface
       - 1.2. Create TokenPair type definition
     
     2. Phase: Core implementation (2 tasks, each includes unit + integration tests)
       - 2.1. Implement token refresh utility — Story 1
             (includes: unit tests for refresh/expiry/error, integration test against mock auth)
             (depends: 1.1)
       - 2.2. Implement token store — Story 2
             (includes: unit tests for get/set/clear)
             (depends: 1.1)
     
     3. Phase: E2E testing (1 task) — Story N
       - 3.1. E2E tests — token lifecycle
             (depends: 2.1, 2.2)
     
     Total: 3 phases, 5 implementation tasks
     
     Based on:
     - Requirements: 2 implementation stories + 1 E2E story
     - Design components: TokenStore, TokenRefresher
     - Files to create: 4 new files, 0 modified
     - Testing: unit/integration bundled per story, E2E separate
     ```

   - Ask: "Does this implementation plan look correct? (yes/no/edit)"
   - If no: Exit gracefully
   - If edit: Allow user to provide feedback, regenerate plan
   - If yes: Proceed to task creation

9. **Create phase tasks**
   - For each phase (numbered sequentially starting from 1):
     - Generate phase slug from name (lowercase, spaces/special chars to hyphens)

      ```bash
      task add "<phase-number>. Phase: <phase-name>" \
        project:<JIRAKEY> \
        jiraid:<JIRAKEY> \
        repository:<repo> \
        work_state:todo \
        +impl +phase
      ```

   - **Note**: Phase task is linked to Jira via `jiraid` UDA, NOT via `depends:` field
   - Capture phase UUID from command output (parse "Created task <id>." and get UUID via `task <id> _get uuid`)
   - Build map: phase-number → { uuid: phase-uuid, slug: phase-slug }

10. **Create implementation tasks**
    For each task in the generated plan:

    a. **Build task description**:

    ```
    <task-title> (Story <N>)
    
    <detailed-description>
    
    Tests (TDD — write these first):
    - Unit: <list from story's test acceptance criteria>
    - Integration: <list from story's test acceptance criteria, if any>
    
    Acceptance: <all story acceptance criteria including tests>
    
    Estimated: <effort-estimate>
    
    Spec: <spec-file-path>
    ```

    For E2E tasks:

    ```
    <task-title> (Story <N> — E2E)
    
    <detailed-description>
    
    E2E tests to write:
    - <list from E2E story acceptance criteria>
    
    Acceptance: <E2E story acceptance criteria>
    
    Estimated: <effort-estimate>
    
    Spec: <spec-file-path>
    ```

    b. **Determine dependencies**:
    - Always depends on the phase task UUID
    - Add inter-task dependencies based on generated plan
      - Resolve task IDs to UUIDs from previously created tasks
      - Build comma-separated UUID list
    - E2E task depends on **all** core implementation tasks
    - If circular dependency detected, warn and skip that dependency

    c. **Determine tags**:
    - Base tags: `+impl`
    - If task is conditional (optional based on analysis): add `+conditional`
    - E2E tasks: add `+e2e`

    d. **Create task**:

      ```bash
      task add "<task-id>. <task-title>" \
        project:<JIRAKEY>.<phase-slug> \
        jiraid:<JIRAKEY> \
        repository:<repo> \
        work_state:todo \
        +impl [+conditional] [+e2e] \
        depends:<phase-uuid>[,<dependency-task-uuids>]
      ```

    e. **Add extended description**:

    ```bash
    task <task-id> modify -- "<full-description>"
    ```

    f. **Store task UUID**: Build map: task-id → task-uuid (for resolving dependencies of later tasks)

11. **Annotate tasks with spec location**
    - For all created implementation tasks (not phases):

      ```bash
      task <task-uuid> annotate "Spec: <spec-file-path>"
      ```

12. **Report back to user**

    ```
    ✅ Tasks created successfully!
    
    Summary:
    - Total tasks: <count> (<phase-count> phases + <impl-count> implementation tasks)
    - Project: <JIRAKEY> (with sub-projects per phase)
    - Repository: <repo>
    - Jira ID: <JIRAKEY>
    - Spec: <spec-file-path>
    
    Tasks by phase:
      📁 <JIRAKEY> (root)
        📁 1. Phase: Data models & types (2 tasks) → <JIRAKEY>.data-models
        📁 2. Phase: Core implementation (2 tasks, tests bundled) → <JIRAKEY>.core-implementation
        📁 3. Phase: E2E testing (1 task) → <JIRAKEY>.e2e-testing
    
    Conditional tasks: <count> (tagged with +conditional)
    
    Next steps:
    - View hierarchy: task project:<JIRAKEY> tree
    - View all tasks: task project:<JIRAKEY> list
    - View ready tasks: task project:<JIRAKEY> +READY list
    - View specific phase: task project:<JIRAKEY>.core-implementation list
    - View E2E tasks: task +e2e jiraid:<JIRAKEY> list
    - View by repo: task repository:<repo> list
    ```

## Notes

- **AI-Generated**: Tasks are generated by analyzing the spec, not parsed from pre-written tasks
- **Tests bundled per story**: Unit and integration tests are part of each implementation task, not separate tasks. Each story in the spec includes its own test acceptance criteria, and the task inherits those.
- **E2E tests are separate**: The final story in Requirements is always an E2E story and gets its own dedicated task(s) tagged `+e2e`
- **TDD within tasks**: Each implementation task description instructs the implementer to write tests first, then implement — but it's a single task, not two
- **Dependencies**: Logical dependency chains based on component relationships. E2E tasks depend on all implementation tasks.
- **Jira linking**: The `jiraid:<JIRAKEY>` UDA links all tasks to the original Jira ticket (NOT via `depends:`)
- **Repository**: The `repository:<repo>` UDA stores the git repo name for filtering across projects
- **Work state**: Always set to `todo` for all created tasks (both phases and implementations)
- **Tags**: `+impl` for all implementation tasks, `+phase` for phase grouping tasks, `+e2e` for E2E test tasks, `+conditional` for optional tasks
- **Hierarchical project structure**:
  - Phase tasks use `project:<JIRAKEY>` (root level)
  - Implementation tasks use `project:<JIRAKEY>.<phase-slug>` (nested under phase)
  - This enables `task project:<JIRAKEY> tree` to show proper hierarchy
- **Spec annotation**: Every task annotated with spec file location for reference
- **Non-blocking hierarchy**: Phase tasks do NOT depend on spec task (linked via `jiraid` only)

## Task Generation Guidelines

When analyzing the spec to generate tasks, follow these principles:

### From Requirements Section

- **Implementation stories** → Each becomes one task that includes implementation + unit/integration tests
- **Test acceptance criteria within stories** → Folded into the task's acceptance criteria and description
- **E2E story (always last)** → Becomes a separate task/phase
- **Out of scope** → Don't create tasks for explicitly excluded items

### From Design Section

- **Files (New)** → Map to the story task that owns that file
- **Files (Changed)** → Map to the story task that owns that change
- **Files (Removed)** → Create task to remove the file
- **Component graph** → Use to determine task dependencies
- **Data models** → Create tasks for defining types/interfaces/models (these may precede story tasks)
- **Testing strategy table** → Use the "Test files by story" table to confirm which tests belong to which story task and which belong to the E2E task
- **Error handling** → Fold into the relevant story's implementation task
- **Runtime & modules** → Create setup/configuration tasks if needed

### Task Ordering

1. **Setup/Preparation** - Configuration, dependencies, infrastructure
2. **Types/Models** - Data structures and interfaces
3. **Core implementation** - One task per story (tests + implementation bundled, TDD within each)
4. **E2E testing** - End-to-end tests from the final story (depends on all core tasks)

## Example Analysis

**Given this spec:**

```markdown
# Token Refresh Utility

## Requirements

### 1. Token refresh utility

**Story:** AS a backend service, I WANT to refresh access tokens automatically, 
SO THAT upstream calls remain authenticated.

- **1.1. Refresh on expiry**
  - WHEN a request is made and the token is expired,
  - THEN the system SHALL fetch a new token and retry once
- **1.2. Propagate failures**
  - WHEN token refresh fails,
  - THEN the system SHALL return a typed error with cause
- **1.3. Unit & integration tests**
  - WHEN this story is implemented,
  - THEN the following tests SHALL pass:
    - Unit: refresh triggers on expired token, returns cached when valid, typed error on failure
    - Integration: full refresh flow against mock auth server

### 2. Token store

**Story:** AS a backend service, I WANT an in-memory token store, SO THAT tokens are cached.

- **2.1. Store and retrieve**
  - WHEN a token pair is stored,
  - THEN the system SHALL return it on subsequent get() calls
- **2.2. Unit tests**
  - WHEN this story is implemented,
  - THEN the following tests SHALL pass:
    - Unit: returns null when empty, stores and retrieves, clear() empties store

### 3. E2E tests

**Story:** AS a developer, I WANT end-to-end tests covering the full token lifecycle.

- **3.1. Happy path** — full auth → refresh → retry flow
- **3.2. Failure path** — unreachable auth server, graceful degradation

## Design

### Files
#### New
- `src/token/TokenStore.ts` - In-memory token storage
- `src/token/TokenRefresher.ts` - Token refresh logic

### Testing strategy

| Story | Test file | Type |
|---|---|---|
| 1. Token refresh utility | `test/TokenRefresher.test.ts` | Unit |
| 1. Token refresh utility | `test/TokenRefresher.integration.test.ts` | Integration |
| 2. Token store | `test/TokenStore.test.ts` | Unit |
| 3. E2E tests | `test/e2e/tokenLifecycle.e2e.test.ts` | E2E |
```

**Generated tasks:**

```
Project: IN-1373 (root - contains phase tasks)
├── 1. Phase: Data models (project: IN-1373)
│     └── 1.1. Create TokenStore and TokenPair interfaces (project: IN-1373.data-models)
│
├── 2. Phase: Core implementation (project: IN-1373)
│     ├── 2.1. Implement token refresh utility — Story 1 (project: IN-1373.core-implementation)
│     │        Tests (TDD): test/TokenRefresher.test.ts, test/TokenRefresher.integration.test.ts
│     │        Depends: 1.1
│     └── 2.2. Implement token store — Story 2 (project: IN-1373.core-implementation)
│              Tests (TDD): test/TokenStore.test.ts
│              Depends: 1.1
│
└── 3. Phase: E2E testing (project: IN-1373)
      └── 3.1. E2E tests — token lifecycle — Story 3 (project: IN-1373.e2e-testing) +e2e
               Tests: test/e2e/tokenLifecycle.e2e.test.ts
               Depends: 2.1, 2.2

View with: task project:IN-1373 tree
```

## Error Handling

- **Spec not found**: Exit with clear error message
- **Spec not approved**: Warn but allow continuation with confirmation
- **Empty Requirements/Design**: Exit with error - cannot generate tasks
- **Analysis uncertainty**: Ask user for clarification before creating tasks
- **Taskwarrior errors**: Bubble up Taskwarrior errors with context

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
     - What tests are needed (from Design testing strategy)

5. **Generate implementation plan from spec analysis**

   Based on the Requirements and Design, create a task breakdown:

   a. **Identify implementation phases** (typical phases):
      - Preparation/Setup (if new infrastructure needed)
      - Data models/Types (if new models defined in Design)
      - Core implementation (main feature components)
      - Testing (unit/integration tests from testing strategy)
      - Integration/Validation (if multiple components need integration)

   b. **For each component/file in Design section**:
      - Create task(s) to implement it
      - If there's a testing strategy mentioned, create corresponding test tasks
      - Use TDD approach: create test tasks before implementation tasks

   c. **Determine task dependencies**:
      - Test tasks depend on setup/preparation tasks
      - Implementation tasks depend on their corresponding test tasks (TDD)
      - Integration tasks depend on component implementation tasks
      - Follow logical ordering (data models → business logic → APIs → integration)

   d. **Example task generation logic**:

      ```
      If Design mentions:
        - New file "src/token/TokenStore.ts" with interface TokenStore
      Then create:
        - Task: "Create TokenStore interface"
        - Task: "Write tests for TokenStore" (depends on setup)
        - Task: "Implement TokenStore" (depends on tests)
      
      If Design mentions:
        - Testing strategy with Jest tests in test/
      Then create:
        - Task: "Set up test infrastructure" (if not exists)
        - Task: "Write unit tests for <component>"
      ```

   e. **Build task structure**:

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
              conditional: false
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
     
     2. Phase: Testing (TDD approach) (3 tasks)
       - 2.1. Set up Jest test infrastructure (depends: none)
       - 2.2. Write TokenStore tests (depends: 1.1, 2.1)
       - 2.3. Write TokenRefresher tests (depends: 1.1, 2.1)
     
     3. Phase: Core implementation (2 tasks)
       - 3.1. Implement TokenStore (depends: 2.2)
       - 3.2. Implement TokenRefresher (depends: 2.3)
     
     4. Phase: Integration (2 tasks)
       - 4.1. Create usage example (depends: 3.1, 3.2)
       - 4.2. Integration tests (depends: 4.1)
     
     Total: 4 phases, 9 implementation tasks
     
     Based on:
     - Requirements: 2 user stories
     - Design components: TokenStore, TokenRefresher
     - Files to create: 4 new files, 0 modified
     - Testing strategy: Jest with ts-jest
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
    <task-title>
    
    <detailed-description>
    
    Acceptance: <acceptance-criteria>
    
    Estimated: <effort-estimate>
    
    Spec: <spec-file-path>
    ```

    b. **Determine dependencies**:
    - Always depends on the phase task UUID
    - Add inter-task dependencies based on generated plan
      - Resolve task IDs to UUIDs from previously created tasks
      - Build comma-separated UUID list
    - If circular dependency detected, warn and skip that dependency

    c. **Determine tags**:
    - Base tags: `+impl`
    - If task is conditional (optional based on analysis): add `+conditional`

    d. **Create task**:

      ```bash
      task add "<task-id>. <task-title>" \
        project:<JIRAKEY>.<phase-slug> \
        jiraid:<JIRAKEY> \
        repository:<repo> \
        work_state:todo \
        +impl [+conditional] \
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
        📁 2. Phase: Testing (3 tasks) → <JIRAKEY>.testing
        📁 3. Phase: Core implementation (2 tasks) → <JIRAKEY>.core-implementation
        📁 4. Phase: Integration (2 tasks) → <JIRAKEY>.integration
    
    Conditional tasks: <count> (tagged with +conditional)
    
    Next steps:
    - View hierarchy: task project:<JIRAKEY> tree
    - View all tasks: task project:<JIRAKEY> list
    - View ready tasks: task project:<JIRAKEY> +READY list
    - View specific phase: task project:<JIRAKEY>.testing list
    - View by repo: task repository:<repo> list
    ```

## Notes

- **AI-Generated**: Tasks are generated by analyzing the spec, not parsed from pre-written tasks
- **Intelligent analysis**: AI reads Requirements and Design to determine what needs to be built
- **TDD approach**: Test tasks are created before implementation tasks where applicable
- **Dependencies**: Logical dependency chains based on component relationships
- **Jira linking**: The `jiraid:<JIRAKEY>` UDA links all tasks to the original Jira ticket (NOT via `depends:`)
- **Repository**: The `repository:<repo>` UDA stores the git repo name for filtering across projects
- **Work state**: Always set to `todo` for all created tasks (both phases and implementations)
- **Tags**: `+impl` for all implementation tasks, `+phase` for phase grouping tasks, `+conditional` for optional tasks
- **Hierarchical project structure**:
  - Phase tasks use `project:<JIRAKEY>` (root level)
  - Implementation tasks use `project:<JIRAKEY>.<phase-slug>` (nested under phase)
  - This enables `task project:<JIRAKEY> tree` to show proper hierarchy
- **Spec annotation**: Every task annotated with spec file location for reference
- **Non-blocking hierarchy**: Phase tasks do NOT depend on spec task (linked via `jiraid` only)

## Task Generation Guidelines

When analyzing the spec to generate tasks, follow these principles:

### From Requirements Section

- **User stories** → Identify what features need implementation
- **Acceptance criteria** → Use to generate task acceptance criteria
- **Out of scope** → Don't create tasks for explicitly excluded items

### From Design Section

- **Files (New)** → Create task to create the file
- **Files (Changed)** → Create task to modify the file
- **Files (Removed)** → Create task to remove the file
- **Component graph** → Use to determine task dependencies
- **Data models** → Create tasks for defining types/interfaces/models
- **Testing strategy** → Create test tasks based on what's described
- **Error handling** → Create tasks for implementing error handling
- **Runtime & modules** → Create setup/configuration tasks if needed

### Task Ordering

1. **Setup/Preparation** - Configuration, dependencies, infrastructure
2. **Types/Models** - Data structures and interfaces
3. **Tests (TDD)** - Write tests first
4. **Implementation** - Implement to make tests pass
5. **Integration** - Connect components together
6. **Validation** - End-to-end testing, manual verification

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

## Design

### Files

#### New
- `src/token/TokenStore.ts` - In-memory token storage
- `src/token/TokenRefresher.ts` - Token refresh logic
- `test/TokenStore.test.ts` - TokenStore tests
- `test/TokenRefresher.test.ts` - TokenRefresher tests

### Testing strategy

Use Jest with ts-jest. Run: `npm test`
```

**Generated tasks (with hierarchical projects):**

```
Project: IN-1373 (root - contains phase tasks)
├── 1. Phase: Setup (project: IN-1373)
│     └── 1.1. Verify Jest and ts-jest are configured (project: IN-1373.setup)

├── 2. Phase: Data models (project: IN-1373)
│     └── 2.1. Create TokenStore and TokenPair interfaces (project: IN-1373.data-models)

├── 3. Phase: Testing (project: IN-1373)
│     ├── 3.1. Write TokenStore tests (project: IN-1373.testing)
│     └── 3.2. Write TokenRefresher tests (project: IN-1373.testing)

└── 4. Phase: Implementation (project: IN-1373)
      ├── 4.1. Implement TokenStore (project: IN-1373.implementation)
      └── 4.2. Implement TokenRefresher (project: IN-1373.implementation)

View with: task project:IN-1373 tree
```

## Error Handling

- **Spec not found**: Exit with clear error message
- **Spec not approved**: Warn but allow continuation with confirmation
- **Empty Requirements/Design**: Exit with error - cannot generate tasks
- **Analysis uncertainty**: Ask user for clarification before creating tasks
- **Taskwarrior errors**: Bubble up Taskwarrior errors with context

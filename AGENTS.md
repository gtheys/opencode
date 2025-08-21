# AGENTS.md - SalaryHero

## The Golden Rule

When unsure about implementation details, ALWAYS ask the developer.

## Build & Test Commands

- **Build:** `yarn build`
- **Lint:** `yarn lint`
- **Test:** `yarn test`
- **Run a single test file:** `yarn jest <path_to_test_file>`

## Code Style and Patterns

### Anchor comments

Add specially formatted comments throughout the codebase, where appropriate, for yourself as inline knowledge that can be easily \`grep\`ped for.

### Guidelines

- Use \`AIDEV-NOTE:\`, \`AIDEV-TODO:\`, or \`AIDEV-QUESTION:\` (all-caps prefix) for comments aimed at AI and developers.
- **Important:** Before scanning files, always first try to **grep for existing anchors** \`AIDEV-\*\` in relevant subdirectories.
- **Update relevant anchors** when modifying associated code.
- **Do not remove \`AIDEV-NOTE\`s** without explicit human instruction.
- Make sure to add relevant anchor comments, whenever a file or piece of code is:
  - too complex, or
  - very important, or
  - confusing, or
  - could have a bug

### Code specific

- **Formatting:** Use Prettier with single quotes, trailing commas, and a print width of 100. Run `yarn lint --fix` to format.
- **Imports:** Use ES6 imports. For third-party libraries like lodash, import specific functions (e.g., `import { get } from 'lodash'`).
- **Types:** This is a mixed JS/TS codebase. Use JSDoc for type hints in `.js` files and TypeScript for new files.
- **Naming:**
  - Functions & variables: `camelCase`
  - Database fields: `snake_case`
  - Classes/Enums: `PascalCase`
- **Error Handling:** Use the custom `utils/error.js` for throwing errors (e.g., `error.throwError()`).
- **General:** Follow existing patterns in the code. Do not introduce new libraries without discussion.

## Domain Glossary (learn these!)

- **Agent**: AI entity with memory, tools, and defined behavior
- **Task**: Workflow definition composed of steps (NOT a Celery task)
- **Execution**: Running instance of a task
- **Tool**: Function an agent can call (browser, API, etc.)
- **Session**: Conversation context with memory
- **Entry**: Single interaction within a session

## What AI Must NEVER Do

1. **Never modify test files** - Tests encode human intent
2. **Never change API contracts** - Breaks real applications
3. **Never alter migration files** - Data loss risk
4. **Never commit secrets** - Use environment variables
5. **Never assume business logic** - Always ask
6. **Never remove AIDEV- comments** - They're there for a reason

Remember: We optimize for maintainability over cleverness.  
When in doubt, choose the boring solution.

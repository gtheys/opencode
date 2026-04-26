# HumanLayer Pi Workflow Documentation

This document explains how to use the Pi agent setup with the HumanLayer monorepo. It covers the end-to-end development workflow from ticket discovery to PR creation.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HumanLayer + Pi Integration                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Taskwarrior (Ticket Source)                                                 │
│  │── Jira issues synced via Bugwarrior                                      │
│  │── Spec tasks (+spec tag)                                                 │
│  │── Phase tasks (+impl +phase tags)                                        │
│  │── Implementation tasks (+impl tag)                                       │
│  └─→ Prioritized, status-tracked work items                                 │
│                                                                              │
│  Pi Agent (Orchestration Layer)                                              │
│  │── Prompt Templates: Quick inline commands (/commit, /debug, /ralph-*)   │
│  │── Skills: Complex workflows loaded on-demand                             │
│  │   ├── Research: codebase-analyzer, codebase-locator, web-search          │
│  │   ├── Planning: create-plan, iterate-plan                                │
│  │   ├── Execution: implement-plan, validate-plan                           │
│  │   └── Integration: describe-pr, create-handoff, taskwarrior-plan         │
│  └─→ Session-based, stateful AI assistance                                  │
│                                                                              │
│  thoughts/ Directory (Knowledge Store)                                       │
│  │── shared/research/     # Research findings                               │
│  │── shared/plans/        # Implementation plans                            │
│  │── shared/tickets/      # Ticket documentation                            │
│  │── shared/handoffs/     # Session handoffs                                │
│  │── shared/prs/          # PR descriptions                                 │
│  └─→ Synced via `humanlayer thoughts sync`                                  │
│                                                                              │
│  Git + GitHub (Version Control)                                              │
│  │── Worktrees for isolated development (`~/wt/humanlayer/`)               │
│  │── PRs created via `gh` CLI                                               │
│  └─→ CI/CD integration                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Workflow States

The HumanLayer team uses a ticket workflow managed through taskwarrior:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Triage     │───►│ Spec Needed  │───►│ Research     │───►│ Research in  │
│              │    │              │    │ Needed       │    │ Progress     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │
│   In Dev     │◄───│ Ready for    │◄───│ Plan in      │◄──────────┘
│              │    │ Dev          │    │ Review       │
└──────┬───────┘    └──────────────┘    └──────────────┘
       │
       ▼
┌──────────────┐    ┌──────────────┐
│ Code Review  │───►│   Done       │
│              │    │              │
└──────────────┘    └──────────────┘
```

## Daily Workflow

### 1. Start Your Day — Check What's Ready

```bash
# In your project directory, launch pi
pi

# Then in pi, check what's ready for work
/skill:taskwarrior-plan
```

Or use the taskwarrior CLI directly:
```bash
!task work_state:ready_for_dev status:pending list
```

### 2. Research a Ticket

When a ticket needs investigation before planning:

```bash
# In pi:
/skill:ralph-research ENG-1234
```

This will:
1. Fetch the ticket from taskwarrior
2. Read the ticket and any linked documents
3. Move the ticket to "research in progress"
4. Use `/skill:research-codebase` to investigate the codebase
5. Create a research document in `thoughts/shared/research/`
6. Move the ticket to "research in review"

**Example interaction:**
```
You: /skill:ralph-research ENG-1234
Pi: I'll research ENG-1234: "Add MCP keepalive for daemon connections"
Pi: [Fetches ticket, reads it, researches codebase]
Pi: ✅ Completed research for ENG-1234
Pi: Research created at: thoughts/shared/research/2025-01-08-ENG-1234-mcp-keepalive.md
```

### 3. Create an Implementation Plan

After research is complete, create a detailed plan:

```bash
# In pi:
/skill:ralph-plan ENG-1234
```

Or directly:
```bash
/skill:create-plan thoughts/shared/tickets/ENG-1234.md
```

This will:
1. Fetch the ticket
2. Read any research documents
3. Move ticket to "plan in progress"
4. Research the codebase for implementation patterns
5. Create a plan in `thoughts/shared/plans/`
6. Move ticket to "plan in review"

**Example interaction:**
```
You: /skill:ralph-plan ENG-1234
Pi: I'll create an implementation plan for ENG-1234
Pi: [Reads research, analyzes codebase, asks clarifying questions]
Pi: Based on my research, I propose these phases:
    1. Add heartbeat protocol to MCP client
    2. Implement reconnection logic
    3. Add tests and update documentation
Pi: Does this structure look right?
You: Yes, but add error handling in phase 2
Pi: [Updates plan, writes to file]
Pi: ✅ Plan created at thoughts/shared/plans/2025-01-08-ENG-1234-mcp-keepalive.md
```

### 4. Iterate on a Plan

If the plan needs changes after review:

```bash
# In pi:
/skill:iterate-plan thoughts/shared/plans/2025-01-08-ENG-1234-mcp-keepalive.md
```

Or with specific feedback:
```bash
/skill:iterate-plan thoughts/shared/plans/2025-01-08-ENG-1234-mcp-keepalive.md add phase for metrics collection
```

### 5. Implement the Plan

When the plan is approved and ticket is "ready for dev":

```bash
# In pi:
/skill:ralph-impl ENG-1234
```

This will:
1. Fetch the ticket
2. Read the linked implementation plan
3. Move ticket to "in dev"
4. Create a git worktree at `~/wt/humanlayer/ENG-1234`
5. Launch a new pi session in the worktree

**Worktree strategy:**
- Main repo: Your stable branch, keeps thoughts/ directory
- Worktree: `~/wt/humanlayer/ENG-1234` — isolated development environment
- The `thoughts/` directory is synced between main repo and worktrees
- Always use relative paths starting with `thoughts/shared/...`

### 6. Implement Phase by Phase

Inside the worktree session:

```bash
# Read the plan
/skill:implement-plan thoughts/shared/plans/2025-01-08-ENG-1234-mcp-keepalive.md
```

Pi will:
1. Read the plan and check for completed phases
2. Start with the first uncompleted phase
3. Make the code changes
4. Run automated verification (`make check test`)
5. **Pause for manual verification** before proceeding to next phase

**Example interaction:**
```
You: /skill:implement-plan thoughts/shared/plans/2025-01-08-ENG-1234-mcp-keepalive.md
Pi: Starting Phase 1: Add heartbeat protocol...
Pi: [Makes changes to hld/mcp/client.go, adds heartbeat goroutine]
Pi: Running automated verification...
Pi: ✓ Build passes
Pi: ✓ Tests pass
Pi: 
Pi: Phase 1 Complete - Ready for Manual Verification
Pi: 
Pi: Automated verification passed:
Pi:   - Build passes: make build
Pi:   - Unit tests pass: go test ./hld/...
Pi: 
Pi: Please perform manual verification:
Pi:   - [ ] Test daemon connects and maintains connection for >5 min
Pi:   - [ ] Verify no errors in logs: tail -f ~/.humanlayer/logs/daemon-*.log
Pi: 
Pi: Let me know when manual testing is complete.
You: Manual testing passed, continue
Pi: Starting Phase 2: Implement reconnection logic...
```

### 7. Commit Changes

When implementation is complete:

```bash
# In pi:
/commit
```

This will:
1. Review what changed in the session
2. Run `git status` and `git diff`
3. Propose atomic commits with clear messages
4. Stage files specifically (never `git add -A`)
5. Create commits

### 8. Create PR Description

```bash
# In pi:
/skill:describe-pr
```

This will:
1. Check for the PR template (`thoughts/shared/pr_description.md`)
2. Find the PR for current branch
3. Gather diff and commit history
4. Run verification commands
5. Write PR description to `thoughts/shared/prs/{number}_description.md`
6. Update the PR on GitHub

### 9. Validate Implementation

Before merging, verify everything:

```bash
# In pi:
/skill:validate-plan thoughts/shared/plans/2025-01-08-ENG-1234-mcp-keepalive.md
```

This checks:
- All phases marked complete are actually done
- Automated tests pass
- Code follows existing patterns
- No regressions introduced
- Manual test steps are documented

### 10. Handoff (if needed)

If you need to transfer work to another session:

```bash
# In pi:
/skill:create-handoff
```

This creates:
- Handoff document in `thoughts/shared/handoffs/ENG-1234/`
- Includes: tasks, recent changes, learnings, artifacts, next steps
- Syncs to thoughts repository

To resume:
```bash
# In a new session:
/skill:resume-handoff ENG-1234
# or
/skill:resume-handoff thoughts/shared/handoffs/ENG-1234/2025-01-08_13-44-55_ENG-1234_mcp-keepalive.md
```

## Quick Reference

### Ticket Management

```bash
# Find what's ready to work on
!task work_state:ready_for_dev status:pending list

# Find what's ready for research
!task work_state:research_needed status:pending list

# Find what's ready for planning
!task work_state:ready_for_plan status:pending list

# Create a new ticket from thoughts
/skill:taskwarrior-plan
```

### Research Commands

```bash
# Research codebase (with thoughts directory)
/skill:research-codebase

# Research codebase (without thoughts directory)
/skill:research-codebase-nt

# Find files related to a feature
/skill:codebase-locator "Find all MCP-related files"

# Analyze how something works
/skill:codebase-analyzer "How does the approval flow work in hld?"

# Find patterns to model after
/skill:codebase-pattern-finder "Show me error handling patterns"
```

### Planning Commands

```bash
# Create plan from ticket
/skill:create-plan thoughts/shared/tickets/ENG-1234.md

# Create plan without thoughts directory
/skill:create-plan-nt docs/tickets/ENG-1234.md

# Update existing plan
/skill:iterate-plan thoughts/shared/plans/2025-01-08-ENG-1234.md

# Update plan without thoughts
/skill:iterate-plan-nt docs/plans/2025-01-08-ENG-1234.md
```

### Implementation Commands

```bash
# Implement approved plan
/skill:implement-plan thoughts/shared/plans/2025-01-08-ENG-1234.md

# Validate implementation
/skill:validate-plan thoughts/shared/plans/2025-01-08-ENG-1234.md

# Debug issues
/debug
```

### Git & PR Commands

```bash
# Create commits
/commit

# Create PR description
/skill:describe-pr

# Create PR description without thoughts
/skill:describe-pr-nt
```

### Session Management

```bash
# Create handoff for later
/skill:create-handoff

# Resume from handoff
/skill:resume-handoff ENG-1234

# Review colleague's branch
/local-review username:branch-name
```

## Project-Specific Notes

### HumanLayer Monorepo Structure

The HumanLayer monorepo contains:

- `humanlayer-ts/` — TypeScript SDK
- `humanlayer-go/` — Go SDK
- `humanlayer-ts-vercel-ai-sdk/` — Vercel AI SDK integration
- `hld/` — Go daemon (coordinates approvals, manages Claude Code sessions)
- `hlyr/` — TypeScript CLI with MCP server
- `humanlayer-wui/` — Desktop/Web UI (Tauri + React)
- `claudecode-go/` — Go SDK for Claude Code sessions
- `docs/` — Mintlify documentation

### When Researching, Be Specific

Always specify directories when using research skills:
- If ticket mentions "WUI", specify `humanlayer-wui/`
- If ticket mentions "daemon", specify `hld/`
- If ticket mentions "CLI", specify `hlyr/`

Example:
```
/skill:codebase-locator "Find all files related to MCP in hld/"
/skill:codebase-analyzer "How does approval handling work in hld/daemon/"
```

### Make Commands

HumanLayer uses `make` extensively:
- `make setup` — Resolve dependencies
- `make check-test` — Run all checks and tests
- `make check` — Run linting and type checking
- `make test` — Run all test suites
- `make daemon` — Start the daemon
- `make wui` — Start the WUI

### Thoughts Directory

The `thoughts/` directory is synced and shared:
- Use relative paths: `thoughts/shared/plans/...` not absolute paths
- Run `humanlayer thoughts sync` after creating/modifying documents
- Accessible from both main repo and worktrees

## Troubleshooting

### Pi doesn't see new skills

```bash
# Reload pi resources
pi /reload

# Or restart pi
```

### Taskwarrior tasks not found

```bash
# Ensure bugwarrior has synced
bugwarrior-pull

# Check taskwarrior status
!task status:pending list
```

### Worktree already exists

```bash
# Remove existing worktree
rm -rf ~/wt/humanlayer/ENG-1234
git worktree prune
```

### PR template missing

Create `thoughts/shared/pr_description.md`:
```markdown
## What problem(s) was I solving?

## What user-facing changes did I ship?

## How I implemented it

## How to verify it

### Manual Testing

## Description for the changelog
```

## Tips for Effective Use

1. **Start with research** — Always understand the codebase before planning
2. **Be interactive** — Let pi ask questions at each stage
3. **Verify as you go** — Don't skip automated checks in plans
4. **Commit frequently** — Use `/commit` after each logical chunk
5. **Document learnings** — Use handoffs to preserve context
6. **Use worktrees** — Keep main branch clean, develop in isolation
7. **Be specific** — When asking pi to research, specify directories

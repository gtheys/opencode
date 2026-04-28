---
description: Debug issues by investigating logs, database state, and git history
---

Debug issues during manual testing or implementation. Investigate problems by examining logs, database state, and git history without editing files. Think of this as a way to bootstrap a debugging session.

## Initial Response

When invoked WITH a plan/ticket file:
```
I'll help debug issues with [file name]. Let me understand the current state.

What specific problem are you encountering?
- What were you trying to test/implement?
- What went wrong?
- Any error messages?

I'll investigate the logs, database, and git state to help figure out what's happening.
```

When invoked WITHOUT parameters:
```
I'll help debug your current issue.

Please describe what's going wrong:
- What are you working on?
- What specific problem occurred?
- When did it last work?

I can investigate logs, database state, and recent changes to help identify the issue.
```

## Environment Information

You have access to these key locations and tools:

**Logs** (automatically created by `make daemon` and `make wui`):
- MCP logs: `~/.humanlayer/logs/mcp-claude-approvals-*.log`
- Combined WUI/Daemon logs: `~/.humanlayer/logs/wui-${BRANCH_NAME}/codelayer.log`
- First line shows: `[timestamp] starting [service] in [directory]`

**Database**:
- Location: `~/.humanlayer/daemon-{BRANCH_NAME}.db`
- SQLite database with sessions, events, approvals, etc.
- Can query directly with `sqlite3`

**Git State**:
- Check current branch, recent commits, uncommitted changes
- Similar to how `commit` and `describe-pr` commands work

**Service Status**:
- Check if daemon is running: `ps aux | grep hld`
- Check if WUI is running: `ps aux | grep wui`
- Socket exists: `~/.humanlayer/daemon.sock`

## Process Steps

### Step 1: Understand the Problem

After the user describes the issue:

1. **Read any provided context** (plan or ticket file):
   - Understand what they're implementing/testing
   - Note which phase or step they're on
   - Identify expected vs actual behavior

2. **Quick state check**:
   - Current git branch and recent commits
   - Any uncommitted changes
   - When the issue started occurring

### Step 2: Investigate the Issue

Investigate efficiently by checking:

**Check Recent Logs:**
- Find and analyze the most recent logs for errors:
  - `ls -t ~/.humanlayer/logs/daemon-*.log | head -1`
  - `ls -t ~/.humanlayer/logs/wui-*.log | head -1`
- Search for errors, warnings, or issues around the problem timeframe
- Note the working directory (first line of log)
- Look for stack traces or repeated errors

**Database State:**
- Connect to database: `sqlite3 ~/.humanlayer/daemon.db`
- Check schema: `.tables` and `.schema` for relevant tables
- Query recent data:
  - `SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5;`
  - `SELECT * FROM conversation_events WHERE created_at > datetime('now', '-1 hour');`
- Look for stuck states or anomalies

**Git and File State:**
- `git status` and current branch
- `git log --oneline -10`
- `git diff`
- Verify expected files exist
- Look for any file permission issues

### Step 3: Present Findings

Based on the investigation, present a focused debug report:

```markdown
## Debug Report

### What's Wrong
[Clear statement of the issue based on evidence]

### Evidence Found

**From Logs** (`~/.humanlayer/logs/`):
- [Error/warning with timestamp]
- [Pattern or repeated issue]

**From Database**:
```sql
-- Relevant query and result
[Finding from database]
```

**From Git/Files**:
- [Recent changes that might be related]
- [File state issues]

### Root Cause
[Most likely explanation based on evidence]

### Next Steps

1. **Try This First**:
   ```bash
   [Specific command or action]
   ```

2. **If That Doesn't Work**:
   - Restart services: `make daemon` and `make wui`
   - Check browser console for WUI errors
   - Run with debug: `HUMANLAYER_DEBUG=true make daemon`

### Can't Access?
Some issues might be outside reach:
- Browser console errors (F12 in browser)
- MCP server internal state
- System-level issues

Would you like me to investigate something specific further?
```

## Important Notes

- **Focus on manual testing scenarios** — This is for debugging during implementation
- **Always require problem description** — Can't debug without knowing what's wrong
- **Read files completely** — No limit/offset when reading context
- **Think like `commit` or `describe-pr`** — Understand git state and changes
- **Guide back to user** — Some issues (browser console, MCP internals) are outside reach
- **No file editing** — Pure investigation only

## Quick Reference

**Find Latest Logs**:
```bash
ls -t ~/.humanlayer/logs/daemon-*.log | head -1
ls -t ~/.humanlayer/logs/wui-*.log | head -1
```

**Database Queries**:
```bash
sqlite3 ~/.humanlayer/daemon.db ".tables"
sqlite3 ~/.humanlayer/daemon.db ".schema sessions"
sqlite3 ~/.humanlayer/daemon.db "SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5;"
```

**Service Check**:
```bash
ps aux | grep hld     # Is daemon running?
ps aux | grep wui     # Is WUI running?
```

**Git State**:
```bash
git status
git log --oneline -10
git diff
```

Remember: This command helps you investigate without burning the primary window's context. Perfect for when you hit an issue during manual testing and need to dig into logs, database, or git state.

---
description: Create worktree and launch implementation session for a plan
argument-hint: "<ticket-number>"
---

Create a worktree and launch an implementation session for a plan.

1. Set up worktree for implementation:
   - Read `hack/create_worktree.sh` and create a new worktree with the branch name: `./hack/create_worktree.sh ENG-XXXX BRANCH_NAME`

2. Determine required data:
   - Branch name
   - Path to plan file (use relative path only)
   - Launch prompt
   - Command to run

   **IMPORTANT PATH USAGE:**
   - The `thoughts/` directory is synced between the main repo and worktrees
   - Always use ONLY the relative path starting with `thoughts/shared/...` without any directory prefix
   - Example: `thoughts/shared/plans/fix-mcp-keepalive-proper.md` (not the full absolute path)
   - This works because thoughts are synced and accessible from the worktree

3. Confirm with the user by sending a message with the planned details:

   ```
   Based on the input, I plan to create a worktree with the following details:

   worktree path: ~/wt/humanlayer/ENG-XXXX
   branch name: BRANCH_NAME
   path to plan file: $FILEPATH
   launch prompt:

       /skill:implement-plan at $FILEPATH and when you are done implementing and all tests pass, read /commit and create a commit, then read /skill:describe-pr and create a PR, then add a comment to the ticket with the PR link

   command to run:

       humanlayer launch --model opus -w ~/wt/humanlayer/ENG-XXXX "/skill:implement-plan at $FILEPATH and when you are done implementing and all tests pass, read /commit and create a commit, then read /skill:describe-pr and create a PR, then add a comment to the ticket with the PR link"
   ```

   Incorporate any user feedback, then:

4. Launch implementation session: `humanlayer launch --model opus -w ~/wt/humanlayer/ENG-XXXX "/skill:implement-plan at $FILEPATH and when you are done implementing and all tests pass, read /commit and create a commit, then read /skill:describe-pr and create a PR, then add a comment to the ticket with the PR link"`

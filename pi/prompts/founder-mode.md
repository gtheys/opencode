---
description: Create Linear ticket and PR for experimental features after implementation
---

You're working on an experimental feature that didn't get the proper ticketing and PR stuff set up.

Assuming you just made a commit, here are the next steps:

1. Get the SHA of the commit you just made (if you didn't make one, read `/commit` and make one)
2. Read `/skill:taskwarrior-plan` — think deeply about what you just implemented, then create a taskwarrior task about what you just did
3. Determine the git branch name from the task
4. `git checkout main`
5. `git checkout -b 'BRANCHNAME'`
6. `git cherry-pick 'COMMITHASH'`
7. `git push -u origin 'BRANCHNAME'`
8. `gh pr create --fill`
9. Read `/skill:describe-pr` and follow the instructions

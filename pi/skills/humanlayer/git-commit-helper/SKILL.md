---
name: git-commit-helper
description: >
  Git commit helper using Conventional Commits. Use when the user wants to commit
  changes, says "commit", "git commit", "stage and commit", or needs help writing
  commit messages. Also use for reviewing staged changes before committing.
---

# Git Commit Helper

Help create well-structured git commits following Conventional Commits.

## Workflow

1. **Show staged changes**:
   ```bash
   git diff --staged
   ```

2. **Review what's staged** — commit ONLY staged files, do not add new ones

3. **Determine commit type** based on changes:

   | Type | When to use |
   |------|-------------|
   | `feat` | New feature |
   | `fix` | Bug fix |
   | `docs` | Documentation only |
   | `style` | Formatting, semicolons, etc. (no code change) |
   | `refactor` | Code change that neither fixes nor adds feature |
   | `perf` | Performance improvement |
   | `test` | Adding or correcting tests |
   | `chore` | Build process, dependencies, etc. |
   | `ci` | CI/CD changes |
   | `build` | Build system changes |

4. **Determine scope** (optional but recommended):
   - Most meaningful module/component affected
   - Examples: `feat(api):`, `fix(auth):`, `refactor(utils):`

5. **Write commit message**:
   ```
   <type>(<scope>): <short description>

   <detailed body explaining what and why>
   ```

6. **Commit**:
   ```bash
   git commit -m "<type>(<scope>): <description>" -m "<detailed body>"
   ```

## Rules

- **NO push** — only commit
- **Only staged files** — never `git add` new files unless explicitly asked
- Write a detailed description body explaining the change
- Follow the project's commit convention (Conventional Commits by default)
- If the user provides arguments, use them as the commit message subject

## Examples

```bash
# Simple fix
git commit -m "fix(api): handle null response from auth endpoint"

# Feature with body
git commit -m "feat(payments): add Stripe webhook handler" \
  -m "Implements webhook verification and event dispatching." \
  -m "Adds signature validation using Stripe library."

# Refactor
git commit -m "refactor(utils): extract date formatting to helper"
```

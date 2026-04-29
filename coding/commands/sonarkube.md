---
name: sonarqube
description: "Analyze SonarCloud coverage and quality issues for a specific PR"
agent: general
subtask: true
---

# SonarQube Analysis

Analyze SonarCloud coverage gaps and quality issues for a specific PR. Generates report starting with coverage gaps, then quality issues, with actionable fixes.

**Core principle:** Analysis-only = no code changes, pure insight.

## Process

1. **Verify Token**: Check `$SONARQUBE_TOKEN` environment variable
2. **Detect Project Config**: Auto-detect from `sonar-project.properties` in repo root (fallback: env vars)
3. **Detect PR Number**: Auto-detect from current branch via `gh pr view` (fallback: `$ARGUMENTS`)
4. **Fetch Coverage**: Call SonarCloud API for PR coverage metrics
5. **Fetch Issues**: Call SonarCloud API for PR issues
6. **Parse Data**: Group coverage by file, issues by severity/type/file/rule
7. **Generate Report**: Coverage-first, then quality issues, then action plan
8. **Cleanup**: Remove temporary files

## Prerequisites

### Environment Variable

```bash
# Set SonarQube token (add to ~/.bashrc or ~/.zshrc)
export SONARQUBE_TOKEN="your_token_here"

# Verify token is set
echo $SONARQUBE_TOKEN
```

**To get token:**

1. Go to SonarCloud → My Account → Security
2. Generate new token
3. Copy and export as environment variable

### Project Configuration (Auto-Detected)

**The command auto-detects project config from `sonar-project.properties` in the repo root.** No manual configuration needed if the file exists.

If no `sonar-project.properties` is found, fall back to environment variables:

```bash
SONAR_ORGANIZATION="your-org-name"
SONAR_PROJECT_KEY="your-org_your-project"
SONAR_BASE_URL="https://sonarcloud.io/api"
```

**If neither exists:** Ask user to provide organization and project key.

### PR Number Detection

The command auto-detects the PR number from the current git branch:

```bash
gh pr view --json number -q .number
```

If the `$ARGUMENTS` is empty, the auto-detected PR number is used.
If `$ARGUMENTS` contains a number, that takes priority.

## Auto-Detection Logic

### Step 1: Detect project config from `sonar-project.properties`

```bash
if [ -f "sonar-project.properties" ]; then
  SONAR_PROJECT_KEY=$(grep '^sonar.projectKey=' sonar-project.properties | cut -d= -f2)
  SONAR_ORGANIZATION=$(grep '^sonar.organization=' sonar-project.properties | cut -d= -f2)
  SONAR_BASE_URL="https://sonarcloud.io/api"
fi
```

**Fallback priority:**
1. `sonar-project.properties` (auto-detected)
2. Environment variables (`SONAR_PROJECT_KEY`, `SONAR_ORGANIZATION`)
3. Ask user

### Step 2: Detect PR number

```bash
# If ARGUMENTS is empty, auto-detect from current branch
if [ -z "$ARGUMENTS" ]; then
  PR_NUMBER=$(gh pr view --json number -q .number 2>/dev/null)
  if [ -z "$PR_NUMBER" ]; then
    echo "ERROR: No PR found for current branch. Provide PR number as argument."
    exit 1
  fi
else
  PR_NUMBER="$ARGUMENTS"
fi
```

**Fallback priority:**
1. Explicit argument (e.g. `/sonarqube 283`)
2. Auto-detect from `gh pr view`
3. Error with instructions

## Prerequisites Check

Before making any API calls, **always** run this detection sequence:

```bash
# 1. Verify token
if [ -z "$SONARQUBE_TOKEN" ]; then
  echo "ERROR: SONARQUBE_TOKEN not set. Export it:"
  echo "  export SONARQUBE_TOKEN=your_token_here"
  exit 1
fi

# 2. Auto-detect project config
if [ -f "sonar-project.properties" ]; then
  SONAR_PROJECT_KEY=$(grep '^sonar.projectKey=' sonar-project.properties | cut -d= -f2)
  SONAR_ORGANIZATION=$(grep '^sonar.organization=' sonar-project.properties | cut -d= -f2)
  echo "Auto-detected from sonar-project.properties:"
  echo "  projectKey: $SONAR_PROJECT_KEY"
  echo "  organization: $SONAR_ORGANIZATION"
fi

# 3. Fallback to env vars if not set by properties
SONAR_PROJECT_KEY=${SONAR_PROJECT_KEY:-$SONAR_PROJECT_KEY}
SONAR_ORGANIZATION=${SONAR_ORGANIZATION:-$SONAR_ORGANIZATION}

if [ -z "$SONAR_PROJECT_KEY" ]; then
  echo "ERROR: SONAR_PROJECT_KEY not set and no sonar-project.properties found."
  echo "  Either create sonar-project.properties or export SONAR_PROJECT_KEY."
  exit 1
fi

# 4. Detect PR number
if [ -z "$PR_NUMBER" ]; then
  PR_NUMBER=$(gh pr view --json number -q .number 2>/dev/null)
  if [ -z "$PR_NUMBER" ]; then
    echo "ERROR: Could not detect PR number. Provide it as argument: /sonarqube 283"
    exit 1
  fi
  echo "Auto-detected PR number: $PR_NUMBER"
fi
```

## Fetch Coverage

```bash
sonar-fetch-coverage $PR_NUMBER $SONAR_PROJECT_KEY > /tmp/sonar_coverage_$PR_NUMBER.json
```

**Script:** `sonar-fetch-coverage` (on PATH) — handles authentication and all query parameters.

**API Parameters** (handled by the script):

- `component`: Your project key
- `pullRequest`: PR number
- `metricKeys`:
  - `coverage`: Overall line coverage percentage
  - `new_coverage`: Coverage on new code
  - `uncovered_lines`: Count of uncovered lines
  - `lines_to_cover`: Total lines requiring coverage
  - `new_lines_to_cover`: New code lines requiring coverage
  - `branch_coverage`: Branch/condition coverage percentage
  - `new_branch_coverage`: Branch coverage on new code

## Fetch Issues

```bash
sonar-fetch-issues $PR_NUMBER $SONAR_PROJECT_KEY > /tmp/sonar_pr_$PR_NUMBER.json
```

**Script:** `sonar-fetch-issues` (on PATH) — handles authentication and all query parameters.

**API Parameters** (handled by the script):

- `componentKeys`: Your project key
- `pullRequest`: PR number
- `issueStatuses`: OPEN,CONFIRMED (exclude resolved)
- `sinceLeakPeriod`: Only new issues in this PR
- `ps`: Page size (max 500)

## Coverage Analysis Script

```bash
sonar-analyze-coverage $PR_NUMBER > /tmp/sonar_coverage_analysis_$PR_NUMBER.json
```

**Script:** `sonar-analyze-coverage` (on PATH)

## Issues Analysis Script

```bash
sonar-analyze-issues $PR_NUMBER > /tmp/sonar_analysis_$PR_NUMBER.json
```

**Script:** `sonar-analyze-issues` (on PATH)

**Combined analysis run:**

```bash
sonar-fetch-coverage $PR_NUMBER $SONAR_PROJECT_KEY > /tmp/sonar_coverage_$PR_NUMBER.json
sonar-fetch-issues $PR_NUMBER $SONAR_PROJECT_KEY > /tmp/sonar_pr_$PR_NUMBER.json
sonar-analyze-coverage $PR_NUMBER > /tmp/sonar_coverage_analysis_$PR_NUMBER.json
sonar-analyze-issues $PR_NUMBER > /tmp/sonar_analysis_$PR_NUMBER.json
```

## Report Format

Generate formatted report from analysis:

```
📊 SonarCloud Analysis - PR #XXX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 COVERAGE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Line Coverage: {COVERAGE}% {STATUS_ICON}
New Code Coverage: {NEW_LINE_COVERAGE}% {STATUS_ICON}
Branch Coverage: {BRANCH_COVERAGE}% {STATUS_ICON}
New Branch Coverage: {NEW_BRANCH_COVERAGE}% {STATUS_ICON}

Uncovered Lines: {UNCOVERED_LINES} / {LINES_TO_COVER}

Coverage Thresholds (80% minimum):
✅ Overall: {COVERAGE_GAP}% to target
{NEW_CODE_ICON} New Code: {NEW_COVERAGE_GAP}% to target
{BRANCH_ICON} Branch: {BRANCH_GAP}% to target
{NEW_BRANCH_ICON} New Branch: {NEW_BRANCH_GAP}% to target

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 FILES NEEDING TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. src/components/UserProfile.tsx - 45% coverage (need +35%)
2. src/services/auth.service.ts - 62% coverage (need +18%)
3. src/utils/validation.ts - 71% coverage (need +9%)
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ QUALITY ISSUES SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Issues: {TOTAL}

By Severity:
🔴 Blocker/Critical: {COUNT} ({PERCENTAGE}%)
🟡 Major: {COUNT} ({PERCENTAGE}%)
🔵 Minor/Info: {COUNT} ({PERCENTAGE}%)

By Type:
🐛 Bugs: {COUNT}
🛡️ Vulnerabilities: {COUNT}
🧹 Code Smells: {COUNT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 TOP 10 FILES WITH ISSUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. src/components/UserProfile.tsx - 8 issues
2. src/services/auth.service.ts - 5 issues
3. src/utils/validation.ts - 4 issues
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ TOP 5 VIOLATED RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. typescript:S1854 (MAJOR) - 12 occurrences
   "Dead stores should be removed"

2. typescript:S3776 (CRITICAL) - 8 occurrences
   "Cognitive Complexity of functions should not be too high"

3. typescript:S1186 (MINOR) - 6 occurrences
   "Functions should not be empty"
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ACTION PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Priority 0 - COVERAGE GAPS:
  • Add tests for low-coverage files: {LOW_COVERAGE_FILES}
  • Focus on uncovered branches in: {BRANCH_GAP_FILES}
  • Minimum 80% coverage required before merge

Priority 1 - CRITICAL/BLOCKER ({COUNT} issues):
  • Fix immediately before merge
  • Focus on: {TOP_FILES}

Priority 2 - MAJOR ({COUNT} issues):
  • Address in this PR if possible
  • Consider technical debt ticket if extensive

Priority 3 - MINOR/INFO ({COUNT} issues):
  • Can be addressed in follow-up PR
  • Add to backlog for refactoring sprint

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 LINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View in SonarCloud:
https://sonarcloud.io/project/pull_requests_list?id={PROJECT_KEY}&pullRequest={PR_NUMBER}
```

## Severity Mapping

| SonarCloud | Symbol | Priority | Action |
|------------|--------|----------|--------|
| BLOCKER | 🔴 | P0 | Fix immediately |
| CRITICAL | 🔴 | P0 | Fix immediately |
| MAJOR | 🟡 | P1 | Fix in this PR |
| MINOR | 🔵 | P2 | Consider for follow-up |
| INFO | 🔵 | P3 | Optional improvement |

## Coverage Metrics

| Metric | Description | Threshold | Action |
|--------|-------------|-----------|--------|
| `coverage` | Overall line coverage % | ≥80% | Add tests if below |
| `new_coverage` | Coverage on new code | ≥80% | Required for merge |
| `branch_coverage` | Branch/condition coverage % | ≥80% | Add branch tests |
| `new_branch_coverage` | New code branch coverage | ≥80% | Required for merge |
| `uncovered_lines` | Lines not covered | Minimize | Add specific tests |
| `lines_to_cover` | Total lines requiring coverage | — | Denominator for coverage % |
| `new_lines_to_cover` | New code lines requiring coverage | — | Denominator for new coverage % |

### Coverage Status Icons

- ✅ PASS (≥80%): Coverage meets threshold
- ⚠️ WARNING (70-79%): Close to threshold
- ❌ FAIL (<70%): Below threshold, needs tests

## Issue Types

| Type | Symbol | Description |
|------|--------|-------------|
| BUG | 🐛 | Code that is demonstrably wrong |
| VULNERABILITY | 🛡️ | Security issues |
| CODE_SMELL | 🧹 | Maintainability issue |
| SECURITY_HOTSPOT | 🔒 | Security-sensitive code to review |

## Cleanup

Clean up temporary data files after execution (scripts are on PATH, no cleanup needed for those):

```bash
rm -f /tmp/sonar_coverage_$PR_NUMBER.json
rm -f /tmp/sonar_pr_$PR_NUMBER.json
rm -f /tmp/sonar_coverage_analysis_$PR_NUMBER.json
rm -f /tmp/sonar_analysis_$PR_NUMBER.json
```

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| Token not set | `$SONARQUBE_TOKEN` missing | Ask user to export token |
| 401 Unauthorized | Invalid or expired token | Request new token from SonarCloud |
| 404 Not Found | PR doesn't exist in SonarCloud | Verify PR number and project key |
| Empty issues response | No issues found | Report clean PR, congratulate team |
| Empty coverage response | Coverage not computed | Check sonar-project.properties for coverage config |
| Coverage metrics missing | Tests not run or excluded | Verify test execution and coverage tool setup |
| >500 issues | Pagination limit reached | Warn about incomplete data, suggest filtering |
| Network error | API unreachable | Check internet connection, retry |

## Configuration Options

### Project-Level Configuration

Create `.sonarcloud.properties` or add to `CLAUDE.md`:

```properties
# SonarCloud Configuration
SONAR_ORGANIZATION=your-org
SONAR_PROJECT_KEY=your-org_your-project
SONAR_EXCLUSIONS=**/*.test.ts,**/*.spec.ts,**/migrations/**
SONAR_COVERAGE_EXCLUSIONS=**/*.test.ts,src/test/**
```

### API Rate Limits

SonarCloud API limits:

- Free tier: 10,000 requests/day
- Paid tier: Unlimited

**Tip:** Cache results for repeated queries to same PR.

## Integration Examples

### GitHub Actions

```yaml
- name: SonarQube Analysis
  run: |
    export SONARQUBE_TOKEN=${{ secrets.SONAR_TOKEN }}
    export SONAR_PROJECT_KEY="${{ secrets.SONAR_PROJECT }}"
    claude -p "/sonarqube ${{ github.event.pull_request.number }}"
```

### Pre-merge Hook

Add to `.claude/hooks/pre-merge.sh`:

```bash
#!/bin/bash
PR_NUMBER=$(gh pr view --json number -q .number)
claude -p "/sonarqube $PR_NUMBER"
```

## Red Flags - NEVER Do

**Never:**

- ❌ Modify code or auto-fix issues (analysis-only command)
- ❌ Skip token verification (security risk)
- ❌ Leave temp files in `/tmp` (cleanup required)
- ❌ Commit SonarQube token to repository (use env vars)
- ❌ Run without checking token expiration
- ❌ Skip coverage analysis when issues exist
- ❌ Report coverage without branch coverage metrics
- ❌ Ignore files with very low coverage (<50%)

**Always:**

- ✅ Generate structured, actionable report
- ✅ Show coverage metrics first (coverage-first reporting)
- ✅ Highlight files below 80% coverage threshold
- ✅ Clean up after execution
- ✅ Handle API errors gracefully
- ✅ Verify token is valid before API calls
- ✅ Parse and present data clearly
- ✅ Include both line and branch coverage

## Advanced Usage

### Custom Filters

```bash
# Only show critical/blocker issues
/sonarqube 123 --severity BLOCKER,CRITICAL

# Only show bugs and vulnerabilities
/sonarqube 123 --types BUG,VULNERABILITY

# Specific file pattern
/sonarqube 123 --files "src/services/**"
```

### Multiple PRs

```bash
# Compare issues across PRs
/sonarqube 123,124,125 --compare
```

## Troubleshooting

### Issue: "curl: (22) The requested URL returned error: 401"

**Cause:** Invalid or missing token

**Fix:**

```bash
# Regenerate token in SonarCloud
# Export new token
export SONARQUBE_TOKEN="new_token_here"
```

### Issue: "Empty response or no issues"

**Cause:** Analysis not yet complete or PR not analyzed

**Fix:** Wait for SonarCloud analysis to complete (~2-5 minutes after PR creation)

### Issue: "componentKeys not found"

**Cause:** Wrong project key

**Fix:** Verify project key in SonarCloud URL:

```
https://sonarcloud.io/project/overview?id=YOUR_PROJECT_KEY
```

### Issue: "Coverage metrics all return 0"

**Cause:** Tests not run or coverage tool not configured

**Fix:**

1. Verify `sonar-project.properties` has coverage configuration:
   ```properties
   sonar.coverage.exclusions=**/*.test.ts,**/*.spec.ts,**/test/**
   sonar.javascript.lcov.reportPaths=coverage/lcov.info
   ```

2. Ensure CI pipeline generates coverage report before SonarCloud scan

3. Check that coverage tool (Jest, pytest, etc.) is configured to output LCOV format

### Issue: "Branch coverage shows as -1 or unavailable"

**Cause:** Branch coverage metric not available for language

**Fix:**

- JavaScript/TypeScript: Ensure SonarJS plugin version ≥6.0
- Python: Use pytest-cov with branch coverage enabled (`pytest --cov --cov-branch`)
- Java: Use JaCoCo with JaCoCo plugin configured

## Usage Examples

```bash
# Auto-detect PR from current branch + project from sonar-project.properties
/sonarqube

# Explicit PR number
/sonarqube 283

# Custom severity filter (if implemented)
/sonarqube --critical-only
```

PR Number: $ARGUMENTS

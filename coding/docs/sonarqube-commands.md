# SonarQube Command & Helper Scripts

Analyze SonarCloud coverage and quality issues for a PR — directly from the terminal.

---

## What It Does

The `/sonarqube` command (defined in `commands/sonarkube.md`) fetches PR coverage metrics and quality issues from SonarCloud, then generates a structured report with:

- **Coverage report** — overall, new code, and branch coverage vs. 80% threshold
- **Files needing tests** — prioritized by coverage gap
- **Quality issues** — grouped by severity, type, file, and rule
- **Action plan** — prioritized fixes before merge

It's **analysis-only** — no code changes are made.

---

## Architecture

```
┌─────────────────────┐
│  commands/          │
│  sonarkube.md       │  ← Prompt / instructions for the agent
└─────────┬───────────┘
          │ calls
          ▼
┌─────────────────────┐
│  bin/                │  ← Helper scripts (on PATH)
│  sonar-fetch-coverage│  Fetch coverage metrics from SonarCloud API
│  sonar-fetch-issues  │  Fetch quality issues from SonarCloud API
│  sonar-analyze-coverage │ Parse coverage JSON → structured analysis
│  sonar-analyze-issues   │ Parse issues JSON → structured analysis
└─────────────────────┘
```

| Script | Language | Purpose |
|--------|----------|---------|
| `sonar-fetch-coverage` | Bash | `curl` SonarCloud measures API with auth |
| `sonar-fetch-issues` | Bash | `curl` SonarCloud issues API with auth |
| `sonar-analyze-coverage` | Node.js | Parse coverage metrics into structured JSON |
| `sonar-analyze-issues` | Node.js | Parse issues into structured JSON (grouped by severity/type/file/rule) |

### Why separate scripts?

Previously the command **created temporary scripts in `/tmp/` on every run** — 2 bash heredocs + 2 inline JS scripts written to disk each time. Now they're permanent scripts on PATH: faster, no temp file creation, and editable.

---

## Setup

### 1. Set your SonarQube token

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export SONARQUBE_TOKEN="your_token_here"
```

To get a token:
1. Go to [SonarCloud](https://sonarcloud.io) → My Account → Security
2. Generate a new token
3. Copy and export it

### 2. Add `bin/` to your PATH

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export PATH="$HOME/Code/salaryhero/opencode/bin:$PATH"
```

Then reload your shell:

```bash
source ~/.zshrc  # or ~/.bashrc
```

### 3. Verify setup

```bash
echo $SONARQUBE_TOKEN          # Should show your token
which sonar-fetch-coverage     # Should resolve to .../opencode/bin/sonar-fetch-coverage
which sonar-analyze-coverage  # Should resolve to .../opencode/bin/sonar-analyze-coverage
```

### 4. Project configuration (auto-detected)

If your project has a `sonar-project.properties` in the repo root, the command auto-detects `sonar.projectKey` and `sonar.organization`. No manual setup needed.

If not, set these environment variables:

```bash
export SONAR_ORGANIZATION="your-org-name"
export SONAR_PROJECT_KEY="your-org_your-project"
```

---

## Usage

In an Opencode session:

```
/sonarqube          # Auto-detect PR from current git branch
/sonarqube 283      # Explicit PR number
```

### Manual usage (scripts on their own)

```bash
# Fetch raw data from SonarCloud
PR_NUMBER=1229
SONAR_PROJECT_KEY="Salary-Hero_ewa-api"

sonar-fetch-coverage $PR_NUMBER $SONAR_PROJECT_KEY > /tmp/sonar_coverage_$PR_NUMBER.json
sonar-fetch-issues   $PR_NUMBER $SONAR_PROJECT_KEY > /tmp/sonar_pr_$PR_NUMBER.json

# Analyze the data
sonar-analyze-coverage $PR_NUMBER > /tmp/sonar_coverage_analysis_$PR_NUMBER.json
sonar-analyze-issues   $PR_NUMBER > /tmp/sonar_analysis_$PR_NUMBER.json

# View results
cat /tmp/sonar_coverage_analysis_$PR_NUMBER.json | jq .
cat /tmp/sonar_analysis_$PR_NUMBER.json | jq .

# Cleanup
rm -f /tmp/sonar_coverage_$PR_NUMBER.json /tmp/sonar_pr_$PR_NUMBER.json
rm -f /tmp/sonar_coverage_analysis_$PR_NUMBER.json /tmp/sonar_analysis_$PR_NUMBER.json
```

### Script arguments

| Script | Arguments | Notes |
|--------|-----------|-------|
| `sonar-fetch-coverage` | `<PR_NUMBER> <PROJECT_KEY> [BASE_URL]` | Base URL defaults to `https://sonarcloud.io/api` |
| `sonar-fetch-issues` | `<PR_NUMBER> <PROJECT_KEY> [BASE_URL]` | Base URL defaults to `https://sonarcloud.io/api` |
| `sonar-analyze-coverage` | `<PR_NUMBER> [COVERAGE_JSON_PATH]` | Defaults to `/tmp/sonar_coverage_{PR}.json` |
| `sonar-analyze-issues` | `<PR_NUMBER> [ISSUES_JSON_PATH]` | Defaults to `/tmp/sonar_pr_{PR}.json` |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `SONARQUBE_TOKEN not set` | `export SONARQUBE_TOKEN="your_token"` |
| `401 Unauthorized` | Token expired — regenerate at SonarCloud → Security |
| `404 Not Found` | Wrong PR number or project key |
| `command not found: sonar-fetch-*` | Add `opencode/bin/` to PATH |
| Empty coverage response | CI pipeline hasn't run SonarCloud analysis yet |

---

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| Command definition | `commands/sonarkube.md` | Agent prompt & instructions |
| Fetch coverage | `bin/sonar-fetch-coverage` | Bash curl wrapper |
| Fetch issues | `bin/sonar-fetch-issues` | Bash curl wrapper |
| Analyze coverage | `bin/sonar-analyze-coverage` | Node.js coverage parser |
| Analyze issues | `bin/sonar-analyze-issues` | Node.js issues parser |
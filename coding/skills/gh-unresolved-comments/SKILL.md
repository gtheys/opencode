---
name: gh-unresolved-comments
description: Fetch unresolved (not yet resolved) review comments from GitHub Pull Requests using the gh CLI. Use this skill whenever the user asks about unresolved PR comments, open review threads, pending code review feedback, or wants to check what still needs to be addressed on a PR. Also trigger when the user mentions "unresolved comments", "open review threads", "pending reviews", "what's left to resolve on PR", or wants a summary of outstanding review feedback. Works with any GitHub repository the user has access to via gh CLI.
---

# Fetch Unresolved PR Comments

This skill fetches unresolved review comment threads from a GitHub Pull Request using `gh` CLI's GraphQL API.

## Prerequisites

- `gh` (GitHub CLI) installed and authenticated
- `jq` installed for JSON processing
- The user must have access to the target repository

## How to use

Run the bundled script at `scripts/fetch_unresolved_comments.sh` relative to this skill's directory.

### Basic usage

```bash
bash <SKILL_DIR>/scripts/fetch_unresolved_comments.sh <PR_NUMBER>
```

This auto-detects the repository from the current git directory.

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--repo OWNER/REPO` | Specify repository explicitly | Inferred from git remote |
| `--format json\|table\|minimal` | Output format | `table` |
| `--limit N` | Max review threads to fetch | `100` |

### Output formats

- **table** (default): Human-readable formatted output with thread details, authors, timestamps, and links.
- **json**: Structured JSON with `pr_title`, `pr_url`, `total_review_threads`, `unresolved_count`, and full `unresolved_threads` array. Useful for piping into other tools.
- **minimal**: One-line-per-thread summary, good for quick scanning.

### Examples

```bash
# Current repo, table format
bash <SKILL_DIR>/scripts/fetch_unresolved_comments.sh 42

# Explicit repo, JSON output
bash <SKILL_DIR>/scripts/fetch_unresolved_comments.sh 42 --repo octocat/hello-world --format json

# Quick scan
bash <SKILL_DIR>/scripts/fetch_unresolved_comments.sh 42 --format minimal
```

### What gets returned per thread

Each unresolved thread includes:
- **path**: The file where the comment was made
- **line / startLine**: Line number(s) the comment refers to
- **isOutdated**: Whether the comment is on an outdated diff
- **comments**: All replies in the thread, each with author, body, timestamps, and a direct URL

### Handling pagination

The script fetches up to `--limit` threads (default 100) and up to 10 comments per thread. For PRs with more than 100 review threads, increase the limit or make multiple calls. The GraphQL API supports cursor-based pagination — if you need to extend the script, use the `after` cursor on `reviewThreads`.

### Error handling

- If `gh` is not authenticated, the script exits with a clear error.
- If the repo cannot be inferred (not inside a git directory), use `--repo`.
- If the PR number doesn't exist, the GraphQL API returns an error which the script surfaces.

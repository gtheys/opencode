---
description: Post PRs needing approvals to Teams PR Review chat
---

Here are my open PRs in the salary-hero org that don't yet have 2 approvals:

!`gh api 'search/issues?q=org:salary-hero+type:pr+state:open+author:@me&per_page=30' --jq '.items[] | "\(.repository_url | split("/") | .[-2:] | join("/"))|\(.number)|\(.title)|\(.html_url)"' | while IFS='|' read -r repo number title url; do approvals=$(gh api "repos/${repo}/pulls/${number}/reviews" --jq '[.[] | select(.state == "APPROVED")] | length' 2>/dev/null); if [ "$approvals" -lt 2 ]; then echo "- **${title}** (${approvals}/2 approvals): ${url}"; fi; done`

Send a single message to the Teams PR Review group chat (chat ID: `19:995b89b6aaff4691a2305bb3bb570392@thread.v2`) using the send-chat-message tool.

The message should be in HTML format (contentType: html) and contain:
- A short greeting asking the team for reviews
- A list of each PR as a clickable link with its title and current approval count
- Keep it concise and friendly

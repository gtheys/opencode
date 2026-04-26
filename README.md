# AI Agent Configs

Shared configuration for [pi](https://github.com/mariozechner/pi) and [OpenCode](https://opencode.ai/) AI coding agents.

## Structure

```
.
├── pi/                          # Pi-native configs
│   ├── skills/                  # Pi skills (auto-load on context match)
│   │   ├── jira-taskwarrior-workflow/
│   │   ├── code-reviewer/
│   │   ├── test-diagnostician/
│   │   ├── pr-reviewer/
│   │   └── git-commit-helper/
│   └── prompts/                 # Pi prompt templates (/name)
│       └── sonar.md
├── global/                      # OpenCode shared config
│   ├── opencode.json            # Providers, models, MCP servers
│   ├── skills/
│   │   └── marpit-slides/
│   ├── themes/
│   └── tools/
├── coding/                      # OpenCode coding workflow
│   ├── AGENTS.md                # Project coding guidelines (loaded by pi)
│   ├── skills/                  # OpenCode skills
│   │   ├── taskwarrior/
│   │   ├── tdd-workflow/
│   │   ├── security-review/
│   │   ├── coding-standards/
│   │   ├── gh-unresolved-comments/
│   │   ├── playwright/
│   │   └── acli/
│   ├── commands/                # OpenCode prompt templates (commands)
│   │   ├── implement.md
│   │   ├── createtasks.md
│   │   ├── specjira.md
│   │   ├── git.md
│   │   ├── test.md
│   │   └── ...
│   └── agent/                   # OpenCode prompt templates (agents)
│       ├── code-reviewer.md
│       ├── debugger-ts.md
│       └── ...
├── obsidian/                    # OpenCode for Obsidian agent client
├── general/                     # OpenCode general-purpose config
└── install.sh                   # One-shot symlink installer
```

## Quick Start

```bash
./install.sh
```

This symlinks:
- `coding/AGENTS.md` → `~/.pi/agent/AGENTS.md`
- `pi/skills/*` → `~/.pi/agent/skills/`
- `pi/prompts/*` → `~/.pi/agent/prompts/`
- `global/` → `~/.config/opencode/`

Then add to `~/.pi/agent/settings.json`:

```json
{
  "skills": [
    "~/Code/salaryhero/opencode/global/skills",
    "~/Code/salaryhero/opencode/coding/skills",
    "~/Code/salaryhero/opencode/skills",
    "~/.config/opencode/skills"
  ],
  "prompts": [
    "~/Code/salaryhero/opencode/coding/commands",
    "~/Code/salaryhero/opencode/coding/agent"
  ]
}
```

## Pi Skills

| Skill | Triggered By |
|-------|-------------|
| `jira-taskwarrior-workflow` | "specjira", "createtasks", "implement", Jira IDs |
| `code-reviewer` | After code changes, "review my code" |
| `test-diagnostician` | "run tests", "tests failing" |
| `pr-reviewer` | "PR #123", "review this PR" |
| `git-commit-helper` | "commit", "git commit" |

## Environment Variables

Some configs reference environment variables. Set these in your shell:

| Variable | Used By |
|----------|---------|
| `GRAFANA_SERVICE_ACCOUNT_TOKEN` | MCP: Grafana |
| `HONCHO_API_KEY` | MCP: Honcho |

## Security

- **Never commit** `auth.json`, `.env`, sessions, or any tokens
- The `.gitignore` blocks these automatically
- `global/opencode.json` uses `${VAR}` syntax for secrets — set them in your environment

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/humanlayer-pi-workflow.md`](docs/humanlayer-pi-workflow.md) | End-to-end workflow guide for HumanLayer + Pi agent integration |

## Updating

This repo is the source of truth. Edit files here, then re-run `./install.sh` or let the symlinks pick up changes automatically.

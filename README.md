# OpenCode Configuration

This repository contains OpenCode configurations organized by use case.

## Structure

```
opencode/
├── global/      # Generic shared OpenCode config
├── coding/      # Development/coding workflow config (direnv)
├── obsidian/    # Obsidian agent client config
└── general/     # General-purpose config
```

## Global Configuration (`global/`)

Contains shared configuration that can be used across all use cases:

- Agent definitions
- Custom commands
- Skills
- Themes
- Tools
- Plugins

**Setup:**

```bash
# Create symlink to ~/.config/opencode
ln -s /path/to/opencode/global ~/.config/opencode
```

## Coding Workflow (`coding/`)

Specialized configuration for development workflows with OpenCode. Uses [direnv](https://direnv.net/) to automatically load the environment when entering the directory.

**Setup:**

```bash
# Add to your .envrc in the parent project directory:
export OPENCODE_CONFIG_DIR=/path/to/opencode/coding
```

## Obsidian Integration (`obsidian/`)

Configuration for use with the [obsidian-agent-client](https://github.com/RAIT-09/obsidian-agent-client) plugin. This plugin allows you to use OpenCode directly within Obsidian.

**Setup in Obsidian:**

1. Install the obsidian-agent-client plugin
2. In plugin settings, link the config directory to this folder using the environment variable settings:

   ```
   OPENCODE_CONFIG_DIR=/path/to/opencode/obsidian
   ```

## General Use (`general/`)

Simple configuration for general-purpose tasks.


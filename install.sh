#!/usr/bin/env bash
set -euo pipefail

# AI Agent Configs — Install Script
# Sets up symlinks for pi and opencode configs

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PI_AGENT_DIR="$HOME/.pi/agent"
OPENCODE_CONFIG_DIR="$HOME/.config/opencode"

echo "🔗 Installing AI agent configs from $REPO_DIR"
echo ""

# ─── PI ────────────────────────────────────────────────────────────

mkdir -p "$PI_AGENT_DIR/skills" "$PI_AGENT_DIR/prompts"

# Symlink AGENTS.md
if [[ -f "$PI_AGENT_DIR/AGENTS.md" && ! -L "$PI_AGENT_DIR/AGENTS.md" ]]; then
  echo "⚠️  Backing up existing ~/.pi/agent/AGENTS.md"
  mv "$PI_AGENT_DIR/AGENTS.md" "$PI_AGENT_DIR/AGENTS.md.bak.$(date +%s)"
fi
ln -sf "$REPO_DIR/coding/AGENTS.md" "$PI_AGENT_DIR/AGENTS.md"
echo "✅ ~/.pi/agent/AGENTS.md → coding/AGENTS.md"

# Skills are loaded via paths in ~/.pi/agent/settings.json
# (see Next Steps below) — no symlinks needed.

# Symlink pi-native prompts
for prompt in sonar commit debug local-review; do
  src="$REPO_DIR/pi/prompts/$prompt.md"
  dst="$PI_AGENT_DIR/prompts/$prompt.md"
  if [[ -f "$src" ]]; then
    rm -f "$dst"
    ln -sf "$src" "$dst"
    echo "✅ ~/.pi/agent/prompts/$prompt.md"
  else
    echo "⚠️  pi/prompts/$prompt.md not found, skipping"
  fi
done

# Update pi settings.json to load opencode skills and prompts
SETTINGS="$PI_AGENT_DIR/settings.json"
if [[ -f "$SETTINGS" ]]; then
  echo ""
  echo "📝 Checking ~/.pi/agent/settings.json..."
  # Note: we don't auto-modify settings.json to avoid breaking user configs.
  # The README explains how to add the skills/prompts paths manually.
  echo "   (Add skills/prompts paths manually — see README.md)"
fi

# ─── OpenCode ──────────────────────────────────────────────────────

# Symlink global opencode config
if [[ -d "$OPENCODE_CONFIG_DIR" && ! -L "$OPENCODE_CONFIG_DIR" ]]; then
  echo ""
  echo "⚠️  Backing up existing ~/.config/opencode"
  mv "$OPENCODE_CONFIG_DIR" "$OPENCODE_CONFIG_DIR.bak.$(date +%s)"
fi

ln -sf "$REPO_DIR/global" "$OPENCODE_CONFIG_DIR"
echo ""
echo "✅ ~/.config/opencode → global/"

echo ""
echo "🎉 Done!"
echo ""
echo "Next steps:"
echo "  1. Add environment variables for any \${VAR} references in configs"
echo "  2. Update ~/.pi/agent/settings.json with:"
echo "       \"skills\": ["
echo "         \"$REPO_DIR/pi/skills\","
echo "         \"$REPO_DIR/global/skills\","
echo "         \"$REPO_DIR/coding/skills\","
echo "         \"~/.config/opencode/skills\""
echo "       ],"
echo "       \"prompts\": ["
echo "         \"$REPO_DIR/pi/prompts\","
echo "         \"$REPO_DIR/coding/commands\","
echo "         \"$REPO_DIR/coding/agent\""
echo "       ]"

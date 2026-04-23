// honcho-sync.ts
// OpenCode plugin — post-turn sync + compaction hook for Honcho
// Works alongside your existing Honcho MCP (does NOT duplicate tools)
//
// Drop into: ~/.config/opencode/plugins/honcho-sync.ts
//
// What this does:
//   1. After every agent response, captures user+assistant messages
//   2. Every CADENCE turns, flushes them to Honcho via REST API
//   3. On compaction, injects user profile so memory survives context resets
//   4. On session idle, flushes any remaining buffered messages
//
// Requires your Honcho instance running at localhost:8000

import type { Plugin } from "@opencode-ai/plugin";

const env = (key: string, fallback: string) =>
  (globalThis as any).Bun?.env?.[key] ?? (globalThis as any).process?.env?.[key] ?? fallback;

// ── Config ──────────────────────────────────────────────────────
const API = env("HONCHO_API_URL", "http://localhost:8000/v3");
const API_KEY = env("HONCHO_API_KEY", "local-dev-key");
const WORKSPACE = env("HONCHO_WORKSPACE_ID", "default");
const USER_PEER = env("HONCHO_USER_NAME", env("USER", "user"));
const AGENT_PEER = env("HONCHO_ASSISTANT_NAME", "opencode");
const CADENCE = parseInt(env("HONCHO_SYNC_CADENCE", "3"), 10); // flush every N turns

// ── Honcho REST helper ──────────────────────────────────────────
async function honcho(path: string, options: RequestInit = {}): Promise<any> {
  const resp = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(options.headers as Record<string, string> || {}),
    },
  });
  if (!resp.ok) return null;
  const text = await resp.text();
  try { return JSON.parse(text); } catch { return text; }
}

// ── Peer + session management ───────────────────────────────────
let userPeerId: string | null = null;
let agentPeerId: string | null = null;

async function ensurePeers() {
  if (userPeerId && agentPeerId) return;
  try {
    const user = await honcho(`/workspaces/${WORKSPACE}/peers`, {
      method: "POST",
      body: JSON.stringify({ name: USER_PEER }),
    });
    // If peer already exists, the API may return it or error — try get
    if (user?.id) {
      userPeerId = user.id;
    } else {
      const existing = await honcho(`/workspaces/${WORKSPACE}/peers?name=${USER_PEER}`);
      if (existing?.items?.[0]?.id) userPeerId = existing.items[0].id;
    }

    const agent = await honcho(`/workspaces/${WORKSPACE}/peers`, {
      method: "POST",
      body: JSON.stringify({
        name: AGENT_PEER,
        configuration: { observe_me: false },
      }),
    });
    if (agent?.id) {
      agentPeerId = agent.id;
    } else {
      const existing = await honcho(`/workspaces/${WORKSPACE}/peers?name=${AGENT_PEER}`);
      if (existing?.items?.[0]?.id) agentPeerId = existing.items[0].id;
    }
  } catch (e) {
    // Non-fatal — sync will retry next cadence
  }
}

// Per-OpenCode-session state
interface SyncState {
  honchoSessionId: string | null;
  buffer: Array<{ peer_id: string; content: string }>;
  turnCount: number;
}

const sessions = new Map<string, SyncState>();

function getState(id: string): SyncState {
  let s = sessions.get(id);
  if (!s) {
    s = { honchoSessionId: null, buffer: [], turnCount: 0 };
    sessions.set(id, s);
  }
  return s;
}

async function ensureHonchoSession(state: SyncState, opencodeSessionId: string): Promise<string | null> {
  if (state.honchoSessionId) return state.honchoSessionId;
  await ensurePeers();
  if (!userPeerId) return null;

  // AIDEV-NOTE: Honcho v3 session creation requires { id: "..." } in the body.
  // We reuse the OpenCode session ID so the Honcho session is traceable.
  // The API returns 422 if id is omitted (silent failure in earlier version).
  const honchoId = `opencode-${opencodeSessionId}`;

  try {
    const session = await honcho(`/workspaces/${WORKSPACE}/sessions`, {
      method: "POST",
      body: JSON.stringify({ id: honchoId }),
    });
    if (session?.id) {
      state.honchoSessionId = session.id;

      // AIDEV-NOTE: Peers are set via PUT (replaces the full set), not POST.
      // Body is a dict keyed by peer_id: { observe_me, observe_others }.
      const peersBody: Record<string, { observe_me: boolean; observe_others: boolean }> = {
        [userPeerId]: { observe_me: true, observe_others: true },
      };
      if (agentPeerId) {
        peersBody[agentPeerId] = { observe_me: false, observe_others: true };
      }
      await honcho(
        `/workspaces/${WORKSPACE}/sessions/${session.id}/peers`,
        {
          method: "PUT",
          body: JSON.stringify(peersBody),
        }
      );
    }
    return state.honchoSessionId;
  } catch {
    return null;
  }
}

async function flushBuffer(state: SyncState, opencodeSessionId: string) {
  if (state.buffer.length === 0) return;
  const sessionId = await ensureHonchoSession(state, opencodeSessionId);
  if (!sessionId) return;

  try {
    // AIDEV-NOTE: Honcho v3 messages endpoint requires { messages: [...] } wrapper.
    // Batch all buffered messages in a single request for efficiency.
    await honcho(
      `/workspaces/${WORKSPACE}/sessions/${sessionId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ messages: state.buffer }),
      }
    );
    state.buffer = [];
  } catch {
    // Keep buffer — will retry on next flush
  }
}

async function getUserProfile(): Promise<string | null> {
  await ensurePeers();
  if (!userPeerId) return null;
  try {
    const rep = await honcho(
      `/workspaces/${WORKSPACE}/peers/${userPeerId}/representation`
    );
    return rep?.content || null;
  } catch {
    return null;
  }
}

// ── Plugin ──────────────────────────────────────────────────────

export const HonchoSync: Plugin = async ({ client }) => {
  // Verify Honcho is reachable
  try {
    const health = await fetch(`${API.replace("/v3", "")}/health`);
    if (health.ok) {
      await client.app.log({
        body: {
          service: "honcho-sync",
          level: "info",
          message: `Connected to Honcho at ${API} — sync cadence: every ${CADENCE} turns`,
        },
      });
    }
  } catch {
    await client.app.log({
      body: {
        service: "honcho-sync",
        level: "warn",
        message: `Cannot reach Honcho at ${API} — sync disabled until available`,
      },
    });
  }

  return {
    // ── Message capture ───────────────────────────────────────
    event: async ({ event }) => {
      try {
        const sid =
          (event as any).properties?.sessionID ||
          (event as any).properties?.id ||
          (event as any).session_id;

        if (!sid) return;
        const state = getState(sid);

        // Capture messages after each update
        if (event.type === "message.updated") {
          const msg = (event as any).properties;
          if (!msg?.role || !msg?.content) return;

          // Skip tool calls and system messages
          if (msg.role !== "user" && msg.role !== "assistant") return;

          await ensurePeers();
          const peerId = msg.role === "user" ? userPeerId : agentPeerId;
          if (!peerId) return;

          // Extract text content
          let content = "";
          if (typeof msg.content === "string") {
            content = msg.content;
          } else if (Array.isArray(msg.content)) {
            content = msg.content
              .filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join("\n");
          }

          if (!content || content.length < 5) return;

          // Truncate very long messages (tool output, code blocks)
          if (content.length > 4000) {
            content = content.slice(0, 4000) + "\n[truncated]";
          }

          state.buffer.push({ peer_id: peerId, content });

          // Count assistant turns for cadence gating
          if (msg.role === "assistant") {
            state.turnCount++;

            // Flush at cadence
            if (state.turnCount % CADENCE === 0) {
              await flushBuffer(state, sid);
            }
          }
        }

        // Flush remaining buffer when session goes idle
        if (event.type === "session.idle") {
          await flushBuffer(state, sid);
        }

        // Clean up
        if (event.type === "session.deleted") {
          const state = sessions.get(sid);
          if (state) {
            await flushBuffer(state, sid); // flush before delete
            sessions.delete(sid);
          }
        }
      } catch (e) {
        // Never break the session — memory is best-effort
      }
    },

    // ── Compaction: inject user profile ────────────────────────
    "experimental.session.compacting": async (_input, output) => {
      try {
        const profile = await getUserProfile();
        if (profile) {
          output.context.push(`<honcho_user_profile>
${profile}
</honcho_user_profile>`);
        }
      } catch {
        // Silently degrade
      }
    },
  };
};

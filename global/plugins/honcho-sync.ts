// honcho-sync.ts
// OpenCode plugin — sync messages to Honcho + inject user profile on compaction
//
// Uses @honcho-ai/sdk for Honcho API calls.
//
// AIDEV-NOTE: Architecture informed by types.gen.ts and deepwiki 2.9 / 5.1:
//
// Event flow:
//   message.part.updated  → properties.part: Part (TextPart has type="text", text=string,
//                           messageID, sessionID). Fires repeatedly during streaming.
//                           part.text = FULL accumulated text so far (not just delta).
//   message.updated       → properties.info: Message (has id, role, sessionID).
//                           Fires once when message is complete.
//
// Strategy:
//   1. On message.part.updated where part.type==="text": overwrite partTexts[messageID]
//      with the latest (most complete) part.text.
//   2. On message.updated: pull accumulated text for that messageID, add to pending queue.
//   3. After each assistant message.updated: flush pending queue to Honcho.
//
// session.idle never fires; session.status only emits {"type":"busy"}.

import type { Plugin } from "@opencode-ai/plugin";
import { Honcho } from "@honcho-ai/sdk";

const env = (key: string, fallback: string) =>
  (globalThis as any).Bun?.env?.[key] ?? (globalThis as any).process?.env?.[key] ?? fallback;

// ── Config ──────────────────────────────────────────────────────
const API_URL    = env("HONCHO_API_URL",        "http://localhost:8000");
const API_KEY    = env("HONCHO_API_KEY",        "local-dev-key");
const WORKSPACE  = env("HONCHO_WORKSPACE_ID",   "default");
const USER_PEER  = env("HONCHO_USER_NAME",      env("USER", "user"));
const AGENT_PEER = env("HONCHO_ASSISTANT_NAME", "opencode");

// ── Plugin ──────────────────────────────────────────────────────
export const HonchoSync: Plugin = async ({ client }) => {
  const log = (message: string) =>
    client.app.log({ body: { service: "honcho-sync", level: "info", message } });

  const honcho = new Honcho({ apiKey: API_KEY, workspaceId: WORKSPACE, baseURL: API_URL });

  // Cache Honcho session IDs to avoid repeated get-or-create calls
  // Map: opencodeSessionId → honchoSessionId
  const honchoSessionIds = new Map<string, string>();

  // In-flight text accumulator: messageID → latest full text
  // Each message.part.updated overwrites with the latest accumulated text.
  const partTexts = new Map<string, string>();

  // Pending messages per session waiting to be synced
  const pending = new Map<string, Array<{ role: "user" | "assistant"; content: string }>>();

  // ── Honcho session setup ─────────────────────────────────────
  async function ensureHonchoSession(opencodeSessionId: string): Promise<string | null> {
    const cached = honchoSessionIds.get(opencodeSessionId);
    if (cached) return cached;

    try {
      const userPeer  = await honcho.peer(USER_PEER);
      const agentPeer = await honcho.peer(AGENT_PEER, { configuration: { observeMe: false } });
      const session   = await honcho.session(`opencode-${opencodeSessionId}`);

      // Add peers with individual calls to stay within the SDK's accepted types
      await session.addPeers(userPeer);
      await session.addPeers(agentPeer);

      honchoSessionIds.set(opencodeSessionId, session.id);
      return session.id;
    } catch (e: any) {
      await log(`ERROR creating Honcho session: ${e?.message ?? e}`);
      return null;
    }
  }

  // ── Flush pending messages to Honcho ─────────────────────────
  async function flush(opencodeSessionId: string) {
    const messages = pending.get(opencodeSessionId);
    if (!messages?.length) return;

    const honchoSessionId = await ensureHonchoSession(opencodeSessionId);
    if (!honchoSessionId) return;

    try {
      const userPeer  = await honcho.peer(USER_PEER);
      const agentPeer = await honcho.peer(AGENT_PEER, { configuration: { observeMe: false } });
      const session   = await honcho.session(honchoSessionId);

      const sdkMessages = messages.map(({ role, content }) =>
        (role === "user" ? userPeer : agentPeer).message(content)
      );

      await session.addMessages(sdkMessages);
      pending.set(opencodeSessionId, []);
      await log(`synced ${sdkMessages.length} messages → ${honchoSessionId}`);
    } catch (e: any) {
      await log(`ERROR flushing to Honcho: ${e?.message ?? e}`);
    }
  }

  // ── Startup health check ─────────────────────────────────────
  try {
    await honcho.peer(USER_PEER);
    await log(`Connected to Honcho at ${API_URL} (user: ${USER_PEER})`);
  } catch (e: any) {
    await log(`Cannot reach Honcho at ${API_URL}: ${e?.message ?? e}`);
  }

  return {
    event: async ({ event }) => {
      try {
        const props = (event as any).properties;

        // ── 1. Accumulate text from streaming parts ──────────
        if (event.type === "message.part.updated") {
          const part = props?.part;
          // Only capture TextParts with actual content
          if (
            part?.type === "text" &&
            typeof part.text === "string" &&
            part.text.length > 0 &&
            !part.synthetic &&
            !part.ignored
          ) {
            partTexts.set(part.messageID as string, part.text as string);
          }
          return;
        }

        // ── 2. Finalise message and enqueue for sync ─────────
        if (event.type === "message.updated") {
          const info = props?.info;
          if (!info?.id || !info?.sessionID) return;
          if (info.role !== "user" && info.role !== "assistant") return;

          // Get the accumulated text for this message
          const text = partTexts.get(info.id as string) ?? "";
          partTexts.delete(info.id as string);

          // Skip short/empty messages (tool calls, summaries, etc.)
          const content = text.trim();
          if (content.length < 5) return;

          const sid = info.sessionID as string;
          const queue = pending.get(sid) ?? [];
          queue.push({
            role: info.role as "user" | "assistant",
            content: content.length > 4000 ? content.slice(0, 4000) + "\n[truncated]" : content,
          });
          pending.set(sid, queue);

          // Flush after each completed assistant turn
          if (info.role === "assistant") {
            await flush(sid);
          }
          return;
        }

        // ── 3. Clean up on session delete ────────────────────
        if (event.type === "session.deleted") {
          const sid = props?.info?.id ?? props?.sessionID;
          if (sid) {
            await flush(sid as string);
            pending.delete(sid as string);
            honchoSessionIds.delete(sid as string);
          }
        }
      } catch (e: any) {
        await log(`ERROR: ${e?.message ?? e}`);
      }
    },

    // ── Compaction: inject user profile into context ─────────
    "experimental.session.compacting": async (_input, output) => {
      try {
        const userPeer = await honcho.peer(USER_PEER);
        const profile  = await userPeer.getRepresentation();
        if (profile) {
          output.context.push(`<honcho_user_profile>\n${profile}\n</honcho_user_profile>`);
        }
      } catch {
        // Silently degrade — compaction still works without the profile
      }
    },
  };
};

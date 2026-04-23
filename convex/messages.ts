import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ────────────────────────────────────────────────────────────

export const listConversations = query({
  handler: async (ctx) => {
    const convos = await ctx.db.query("conversations").take(100);
    const allUsers = await ctx.db.query("users").take(200);
    const userMap: Record<string, { displayName: string; onlineStatus?: string }> = {};
    for (const u of allUsers) {
      userMap[u.externalId] = { displayName: u.displayName, onlineStatus: u.onlineStatus };
    }
    console.log(`[MSG] listConversations: ${convos.length} convos`);
    return convos.map((conv) => ({
      ...conv,
      memberDetails: conv.members.map((m: string) => ({
        id: m,
        displayName: userMap[m]?.displayName || null,
        onlineStatus: userMap[m]?.onlineStatus || null,
      })),
    }));
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    console.log(`[MSG] getConversation: ${conversationId}`);
    const conv = await ctx.db.get(conversationId);
    console.log(`[MSG] ${conv ? `✅ Found: type=${conv.type}, members=${conv.members.length}` : '❌ Not found'}`);
    return conv;
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    console.log(`[MSG] getMessages for ${conversationId}: returned ${msgs.length} messages`);
    return await Promise.all(msgs.map(async (msg) => {
      if (msg.type === "voice" && msg.fileUrl && !msg.fileUrl.startsWith("http")) {
        const url = await ctx.storage.getUrl(msg.fileUrl as any);
        return { ...msg, fileUrl: url ?? msg.fileUrl };
      }
      return msg;
    }));
  },
});

// ── Mutations ──────────────────────────────────────────────────────────

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    content: v.string(),
    type: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    mentions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { conversationId, senderId, content, type, fileUrl, fileName, mentions }) => {
    console.log(`[MSG] ✉️ sendMessage: conv=${conversationId}, sender=${senderId}, content="${content.substring(0, 50)}..."${mentions?.length ? `, mentions=${mentions.join(',')}` : ''}`);
    const now = Date.now();
    const msgId = await ctx.db.insert("messages", {
      conversationId,
      senderId,
      content,
      type: type ?? "text",
      sentAt: now,
      fileUrl,
      fileName,
      mentions,
    });

    // Update last message + mark unread for every member except the sender
    const conv = await ctx.db.get(conversationId);
    const unreadBy: Record<string, boolean> = { ...(conv?.unreadBy ?? {}) };
    for (const memberId of (conv?.members ?? [])) {
      unreadBy[memberId] = memberId !== senderId;
    }
    await ctx.db.patch(conversationId, {
      lastMessage: content,
      lastMessageBy: senderId,
      lastMessageAt: now,
      unreadBy,
    });

    console.log(`[MSG] ✅ Message sent: ${msgId}`);
    return msgId;
  },
});

export const createConversation = mutation({
  args: {
    type: v.string(),
    name: v.optional(v.string()),
    members: v.array(v.string()),
  },
  handler: async (ctx, { type, name, members }) => {
    console.log(`[MSG] 🆕 createConversation: type=${type}, name=${name}, members=${members.join(',')}`);
    const id = await ctx.db.insert("conversations", {
      type,
      name,
      members,
      unreadCount: 0,
    });
    console.log(`[MSG] ✅ Conversation created: ${id}`);
    return id;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const markConversationRead = mutation({
  args: { conversationId: v.id("conversations"), userId: v.string() },
  handler: async (ctx, { conversationId, userId }) => {
    const conv = await ctx.db.get(conversationId);
    if (!conv) return;
    const unreadBy = { ...(conv.unreadBy ?? {}), [userId]: false };
    await ctx.db.patch(conversationId, { unreadBy });
  },
});

export const clearAllConversationsAndMessages = mutation({
  args: {},
  handler: async (ctx) => {
    console.log(`[MSG] 🗑️ Clearing all conversations and messages...`);
    const convos = await ctx.db.query("conversations").take(200);
    for (const conv of convos) {
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .take(500);
      for (const msg of msgs) {
        await ctx.db.delete(msg._id);
      }
      await ctx.db.delete(conv._id);
    }
    console.log(`[MSG] ✅ Cleared ${convos.length} conversations`);
    return { success: true, cleared: convos.length };
  },
});

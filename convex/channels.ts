import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ────────────────────────────────────────────────────────────

export const listChannels = query({
  handler: async (ctx) => {
    const channels = await ctx.db.query("channels").take(200);
    const allStaff = await ctx.db.query("staffAccounts").take(500);
    const activeUserIds = new Set(allStaff.filter((a) => a.isActive).map((a) => a.userId));
    console.log(`[CHAN] listChannels: ${channels.length} channels, ${activeUserIds.size} active staff`);
    return channels.map((ch) => ({
      ...ch,
      memberCount: ch.members.filter((m) => activeUserIds.has(m)).length,
    }));
  },
});

export const getChannel = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    console.log(`[CHAN] getChannel: ${channelId}`);
    const ch = await ctx.db.get(channelId);
    console.log(`[CHAN] ${ch ? `✅ Found: ${ch.displayName} (${ch.memberCount} members)` : '❌ Not found'}`);
    return ch;
  },
});

export const getChannelMessages = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    const msgs = await ctx.db
      .query("channelMessages")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .collect();
    console.log(`[CHAN] getChannelMessages for ${channelId}: returned ${msgs.length} messages`);
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

export const sendChannelMessage = mutation({
  args: {
    channelId: v.id("channels"),
    senderId: v.string(),
    content: v.string(),
    type: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    mentions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { channelId, senderId, content, type, fileUrl, fileName, mentions }) => {
    console.log(`[CHAN] ✉️ sendChannelMessage: channel=${channelId}, sender=${senderId}, content="${content.substring(0, 50)}"${mentions?.length ? `, mentions=${mentions.join(',')}` : ''}`);
    const id = await ctx.db.insert("channelMessages", {
      channelId,
      senderId,
      content,
      type: type ?? "text",
      sentAt: Date.now(),
      fileUrl,
      fileName,
      mentions,
    });
    const ch = await ctx.db.get(channelId);
    if (ch) await ctx.db.patch(channelId, { unreadCount: (ch.unreadCount ?? 0) + 1 });
    console.log(`[CHAN] ✅ Channel message sent: ${id}`);
    return id;
  },
});

export const markChannelRead = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    await ctx.db.patch(channelId, { unreadCount: 0 });
  },
});

export const toggleChannelStar = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    const channel = await ctx.db.get(channelId);
    if (!channel) throw new Error("Channel not found");
    await ctx.db.patch(channelId, { isStarred: !channel.isStarred });
    console.log(`[CHAN] ⭐ Channel star toggled: ${channel.displayName} → ${!channel.isStarred}`);
    return { success: true, isStarred: !channel.isStarred };
  },
});

export const joinChannel = mutation({
  args: {
    channelId: v.id("channels"),
    userId: v.string(),
  },
  handler: async (ctx, { channelId, userId }) => {
    const channel = await ctx.db.get(channelId);
    if (!channel) throw new Error("Channel not found");
    if (channel.members.includes(userId)) return channelId; // already a member
    await ctx.db.patch(channelId, {
      members: [...channel.members, userId],
      memberCount: channel.memberCount + 1,
    });
    console.log(`[CHAN] ✅ ${userId} joined channel ${channelId}`);
    return channelId;
  },
});

export const createChannel = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    members: v.array(v.string()),
    admins: v.array(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(`[CHAN] 🆕 createChannel: ${args.displayName} (${args.type}), ${args.members.length} members`);
    const id = await ctx.db.insert("channels", {
      name: args.name,
      displayName: args.displayName,
      description: args.description,
      type: args.type,
      members: args.members,
      admins: args.admins,
      unreadCount: 0,
      isStarred: false,
      memberCount: args.members.length,
    });
    console.log(`[CHAN] ✅ Channel created: ${id}`);
    if (args.createdBy) {
      await ctx.db.insert("activityLogs", {
        action: "Channel Created",
        category: "channel",
        performedBy: args.createdBy,
        target: `#${args.displayName}`,
        details: `${args.type} channel "${args.displayName}" created with ${args.members.length} members`,
        timestamp: Date.now(),
      });
    }
    return id;
  },
});

export const updateChannel = mutation({
  args: {
    channelId: v.id("channels"),
    displayName: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, { channelId, displayName, description, type, updatedBy }) => {
    const channel = await ctx.db.get(channelId);
    if (!channel) throw new Error("Channel not found");
    console.log(`[CHAN] ✏️ updateChannel: ${channelId}`);
    const patch: Record<string, unknown> = {};
    if (displayName !== undefined) {
      patch.displayName = displayName;
      patch.name = displayName.toLowerCase().replace(/\s+/g, '-');
    }
    if (description !== undefined) patch.description = description;
    if (type !== undefined) patch.type = type;
    await ctx.db.patch(channelId, patch);
    if (updatedBy) {
      await ctx.db.insert("activityLogs", {
        action: "Channel Updated",
        category: "channel",
        performedBy: updatedBy,
        target: `#${displayName || channel.displayName}`,
        details: `Channel "${channel.displayName}" updated`,
        timestamp: Date.now(),
      });
    }
    return { success: true };
  },
});

export const deleteChannel = mutation({
  args: { channelId: v.id("channels"), deletedBy: v.optional(v.string()) },
  handler: async (ctx, { channelId, deletedBy }) => {
    const channel = await ctx.db.get(channelId);
    if (!channel) throw new Error("Channel not found");
    console.log(`[CHAN] 🗑️ deleteChannel: ${channel.displayName}`);
    // Delete all channel messages
    const messages = await ctx.db
      .query("channelMessages")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .take(500);
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    const name = channel.displayName;
    await ctx.db.delete(channelId);
    if (deletedBy) {
      await ctx.db.insert("activityLogs", {
        action: "Channel Deleted",
        category: "channel",
        performedBy: deletedBy,
        target: `#${name}`,
        details: `Channel "${name}" and its messages deleted`,
        timestamp: Date.now(),
      });
    }
    return { success: true };
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const announcements = await ctx.db
      .query("announcements")
      .order("desc")
      .take(50);
    console.log(`[ANN] listAnnouncements: returned ${announcements.length}`);
    return announcements;
  },
});

export const getAnnouncement = query({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    console.log(`[ANN] getAnnouncement: ${announcementId}`);
    return await ctx.db.get(announcementId);
  },
});

export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    author: v.string(),
    authorName: v.optional(v.string()),
    priority: v.optional(v.string()),
    audience: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    isPinned: v.optional(v.boolean()),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      fileType: v.string(),
      size: v.number(),
      storageId: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    console.log(`[ANN] 🆕 createAnnouncement: "${args.title}" by ${args.author}`);
    const staffAccounts = await ctx.db.query("staffAccounts").collect();
    const activeCount = staffAccounts.filter((a) => a.isActive).length;

    const id = await ctx.db.insert("announcements", {
      title: args.title,
      body: args.body,
      author: args.author,
      authorName: args.authorName,
      priority: args.priority || "normal",
      audience: args.audience || "all",
      expiresAt: args.expiresAt,
      isPinned: args.isPinned || false,
      attachments: args.attachments || [],
      acknowledgedBy: [],
      totalStaff: activeCount,
      createdAt: Date.now(),
    });

    await ctx.db.insert("activityLogs", {
      action: "Announcement Sent",
      category: "announcement",
      performedBy: args.author,
      performedByName: args.authorName,
      target: args.title,
      details: `"${args.title}" sent to ${args.audience || "all"} staff (${args.priority || "normal"} priority)`,
      timestamp: Date.now(),
    });

    console.log(`[ANN] ✅ Announcement created: ${id}`);
    return id;
  },
});

export const deleteAnnouncement = mutation({
  args: { announcementId: v.id("announcements"), deletedBy: v.optional(v.string()) },
  handler: async (ctx, { announcementId, deletedBy }) => {
    const ann = await ctx.db.get(announcementId);
    if (!ann) throw new Error("Announcement not found");
    console.log(`[ANN] 🗑️ deleteAnnouncement: "${ann.title}"`);
    await ctx.db.delete(announcementId);
    if (deletedBy) {
      await ctx.db.insert("activityLogs", {
        action: "Announcement Deleted",
        category: "announcement",
        performedBy: deletedBy,
        target: ann.title,
        details: `Announcement "${ann.title}" deleted`,
        timestamp: Date.now(),
      });
    }
    return { success: true };
  },
});

export const acknowledgeAnnouncement = mutation({
  args: { announcementId: v.id("announcements"), userId: v.string() },
  handler: async (ctx, { announcementId, userId }) => {
    const ann = await ctx.db.get(announcementId);
    if (!ann) throw new Error("Announcement not found");
    if (!ann.acknowledgedBy.includes(userId)) {
      await ctx.db.patch(announcementId, {
        acknowledgedBy: [...ann.acknowledgedBy, userId],
      });
    }
    return { success: true };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

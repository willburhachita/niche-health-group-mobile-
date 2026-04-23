import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listFiles = query({
  handler: async (ctx) => {
    const files = await ctx.db.query("files").collect();
    console.log(`[FILES] listFiles: returned ${files.length} files/folders`);
    return files;
  },
});

export const uploadFileRecord = mutation({
  args: {
    name: v.string(),
    fileType: v.string(),
    size: v.optional(v.number()),
    uploadedBy: v.optional(v.string()),
    storageId: v.optional(v.string()),
    parentFolderId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    console.log(`[FILES] 📁 uploadFileRecord: name=${args.name}, type=${args.fileType}, size=${args.size}`);
    const id = await ctx.db.insert("files", {
      ...args,
      uploadedAt: Date.now(),
    });
    console.log(`[FILES] ✅ File record created: ${id}`);
    return id;
  },
});

export const listAnnouncements = query({
  handler: async (ctx) => {
    const items = await ctx.db.query("announcements").collect();
    console.log(`[FILES] listAnnouncements: returned ${items.length} announcements`);
    return items;
  },
});

export const getAnnouncement = query({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const ann = await ctx.db.get(announcementId);
    console.log(`[FILES] getAnnouncement: ${ann ? ann.title : 'not found'}`);
    return ann;
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Storage helpers ─────────────────────────────────────────────────────
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

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
    patientId: v.optional(v.id("patients")),
    category: v.optional(v.string()),
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

export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();

    const filesWithUrls = [];
    for (const file of files) {
      let url = null;
      if (file.storageId) {
        url = await ctx.storage.getUrl(file.storageId);
      }
      filesWithUrls.push({
        ...file,
        url,
      });
    }
    return filesWithUrls;
  },
});

export const deleteFileRecord = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");
    if (file.storageId) {
      await ctx.storage.delete(file.storageId);
    }
    await ctx.db.delete(args.id);
    return true;
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

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    sections: v.array(
      v.object({
        title: v.string(),
        questions: v.array(
          v.object({
            id: v.string(),
            title: v.string(),
            type: v.string(),
            options: v.optional(v.array(v.string())),
          })
        ),
      })
    ),
    printSettings: v.object({
      title: v.optional(v.string()),
      showLogo: v.boolean(),
      showPatientAddress: v.boolean(),
      showPatientDob: v.boolean(),
      showPatientNhima: v.boolean(),
      showPatientReference: v.boolean(),
      showPatientOccupation: v.boolean(),
    }),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("treatmentNoteTemplates", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("treatmentNoteTemplates"),
    name: v.string(),
    description: v.optional(v.string()),
    sections: v.array(
      v.object({
        title: v.string(),
        questions: v.array(
          v.object({
            id: v.string(),
            title: v.string(),
            type: v.string(),
            options: v.optional(v.array(v.string())),
          })
        ),
      })
    ),
    printSettings: v.object({
      title: v.optional(v.string()),
      showLogo: v.boolean(),
      showPatientAddress: v.boolean(),
      showPatientDob: v.boolean(),
      showPatientNhima: v.boolean(),
      showPatientReference: v.boolean(),
      showPatientOccupation: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
    return id;
  },
});

export const get = query({
  args: { id: v.id("treatmentNoteTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db.query("treatmentNoteTemplates").collect();
    return templates.filter((t) => t.isActive);
  },
});

export const archive = mutation({
  args: { id: v.id("treatmentNoteTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
    return args.id;
  },
});

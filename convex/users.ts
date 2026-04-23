import { query } from "./_generated/server";
import { v } from "convex/values";

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    console.log(`[USERS] listUsers: returned ${users.length} users`);
    return users;
  },
});

export const getUserByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .first();
    return user;
  },
});

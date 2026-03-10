import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./helpers";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const setActiveQuarter = mutation({
  args: { quarterId: v.id("quarters") },
  handler: async (ctx, { quarterId }) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { activeQuarterId: quarterId });
    } else {
      await ctx.db.insert("userSettings", { userId, activeQuarterId: quarterId });
    }
  },
});

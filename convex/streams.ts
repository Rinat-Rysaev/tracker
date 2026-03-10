import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./helpers";

export const listByQuarter = query({
  args: { quarterId: v.id("quarters") },
  handler: async (ctx, { quarterId }) => {
    const streams = await ctx.db
      .query("streams")
      .withIndex("by_quarter", (q) => q.eq("quarterId", quarterId))
      .collect();
    return streams.sort((a, b) => a.order - b.order);
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    quarterId: v.id("quarters"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("streams")
      .withIndex("by_quarter", (q) => q.eq("quarterId", args.quarterId))
      .collect();
    const order = existing.length;
    const streamId = await ctx.db.insert("streams", {
      userId,
      name: args.name,
      color: args.color,
      order,
      quarterId: args.quarterId,
    });
    return streamId;
  },
});

export const update = mutation({
  args: {
    streamId: v.id("streams"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { streamId, ...patch }) => {
    const updates: Record<string, string> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.color !== undefined) updates.color = patch.color;
    await ctx.db.patch(streamId, updates);
  },
});

export const remove = mutation({
  args: { streamId: v.id("streams") },
  handler: async (ctx, { streamId }) => {
    // Cascade delete all tasks in this stream
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("streamId"), streamId))
      .collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    await ctx.db.delete(streamId);
  },
});

export const reorder = mutation({
  args: {
    quarterId: v.id("quarters"),
    orderedIds: v.array(v.id("streams")),
  },
  handler: async (ctx, { quarterId, orderedIds }) => {
    for (let i = 0; i < orderedIds.length; i++) {
      const stream = await ctx.db.get(orderedIds[i]);
      if (stream && stream.quarterId === quarterId) {
        await ctx.db.patch(orderedIds[i], { order: i });
      }
    }
  },
});

export const seed = mutation({
  args: { quarterId: v.id("quarters") },
  handler: async (ctx, { quarterId }) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("streams")
      .withIndex("by_quarter", (q) => q.eq("quarterId", quarterId))
      .collect();
    if (existing.length > 0) return;

    const DEFAULT_STREAMS = [
      { name: "Backend", color: "#6366F1" },
      { name: "Frontend", color: "#EC4899" },
      { name: "Design", color: "#10B981" },
    ];
    for (let i = 0; i < DEFAULT_STREAMS.length; i++) {
      await ctx.db.insert("streams", {
        userId,
        name: DEFAULT_STREAMS[i].name,
        color: DEFAULT_STREAMS[i].color,
        order: i,
        quarterId,
      });
    }
  },
});

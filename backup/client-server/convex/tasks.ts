import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./helpers";

export const listByQuarterWeek = query({
  args: { quarterId: v.id("quarters"), weekNumber: v.number() },
  handler: async (ctx, { quarterId, weekNumber }) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_quarter_week", (q) =>
        q.eq("quarterId", quarterId).eq("weekNumber", weekNumber)
      )
      .collect();
    return tasks.sort((a, b) => a.orderInWeek - b.orderInWeek);
  },
});

export const listByStreamWeek = query({
  args: { streamId: v.id("streams"), weekNumber: v.number() },
  handler: async (ctx, { streamId, weekNumber }) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_stream_week", (q) =>
        q.eq("streamId", streamId).eq("weekNumber", weekNumber)
      )
      .collect();
    return tasks.sort((a, b) => a.orderInCell - b.orderInCell);
  },
});

export const getById = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    return await ctx.db.get(taskId);
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done"),
      v.literal("blocked")
    ),
    streamId: v.id("streams"),
    quarterId: v.id("quarters"),
    weekNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    // Compute orderInCell: count existing tasks in this cell
    const cellTasks = await ctx.db
      .query("tasks")
      .withIndex("by_stream_week", (q) =>
        q.eq("streamId", args.streamId).eq("weekNumber", args.weekNumber)
      )
      .collect();
    const orderInCell = cellTasks.length;

    // Compute orderInWeek: count existing tasks in this week
    const weekTasks = await ctx.db
      .query("tasks")
      .withIndex("by_quarter_week", (q) =>
        q.eq("quarterId", args.quarterId).eq("weekNumber", args.weekNumber)
      )
      .collect();
    const orderInWeek = weekTasks.length;

    return await ctx.db.insert("tasks", {
      userId,
      ...args,
      orderInCell,
      orderInWeek,
    });
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    weekNumber: v.optional(v.number()),
    streamId: v.optional(v.id("streams")),
  },
  handler: async (ctx, { taskId, ...patch }) => {
    const updates: Record<string, unknown> = {};
    if (patch.title !== undefined) updates.title = patch.title;
    if (patch.description !== undefined) updates.description = patch.description;
    if (patch.priority !== undefined) updates.priority = patch.priority;
    if (patch.weekNumber !== undefined) updates.weekNumber = patch.weekNumber;
    if (patch.streamId !== undefined) updates.streamId = patch.streamId;
    await ctx.db.patch(taskId, updates);
  },
});

export const remove = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    await ctx.db.delete(taskId);
  },
});

export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done"),
      v.literal("blocked")
    ),
  },
  handler: async (ctx, { taskId, status }) => {
    await ctx.db.patch(taskId, { status });
  },
});

export const reorderInWeek = mutation({
  args: {
    quarterId: v.id("quarters"),
    weekNumber: v.number(),
    orderedIds: v.array(v.id("tasks")),
  },
  handler: async (ctx, { quarterId, weekNumber, orderedIds }) => {
    for (let i = 0; i < orderedIds.length; i++) {
      const task = await ctx.db.get(orderedIds[i]);
      if (
        task &&
        task.quarterId === quarterId &&
        task.weekNumber === weekNumber
      ) {
        await ctx.db.patch(orderedIds[i], { orderInWeek: i });
      }
    }
  },
});

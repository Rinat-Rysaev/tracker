import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const quarters = await ctx.db
      .query("quarters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return quarters.sort((a, b) => a.year - b.year || a.quarter - b.quarter);
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!settings?.activeQuarterId) return null;
    return await ctx.db.get(settings.activeQuarterId);
  },
});

export const add = mutation({
  args: {
    label: v.string(),
    year: v.number(),
    quarter: v.number(),
    startDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const quarterId = await ctx.db.insert("quarters", { userId, ...args });

    // Set as active
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (settings) {
      await ctx.db.patch(settings._id, { activeQuarterId: quarterId });
    } else {
      await ctx.db.insert("userSettings", { userId, activeQuarterId: quarterId });
    }

    // Seed default streams
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

    return quarterId;
  },
});

export const setActive = mutation({
  args: { quarterId: v.id("quarters") },
  handler: async (ctx, { quarterId }) => {
    const userId = await getAuthUserId(ctx);
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (settings) {
      await ctx.db.patch(settings._id, { activeQuarterId: quarterId });
    } else {
      await ctx.db.insert("userSettings", { userId, activeQuarterId: quarterId });
    }
  },
});

export const remove = mutation({
  args: { quarterId: v.id("quarters") },
  handler: async (ctx, { quarterId }) => {
    const userId = await getAuthUserId(ctx);

    // Delete all tasks for this quarter
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_quarter", (q) => q.eq("quarterId", quarterId))
      .collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Delete all streams for this quarter
    const streams = await ctx.db
      .query("streams")
      .withIndex("by_quarter", (q) => q.eq("quarterId", quarterId))
      .collect();
    for (const stream of streams) {
      await ctx.db.delete(stream._id);
    }

    // Delete the quarter
    await ctx.db.delete(quarterId);

    // Update active quarter if needed
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (settings?.activeQuarterId === quarterId) {
      const remaining = await ctx.db
        .query("quarters")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      await ctx.db.patch(settings._id, {
        activeQuarterId: remaining?._id,
      });
    }
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("quarters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      // Ensure user has settings
      const settings = await ctx.db
        .query("userSettings")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      if (!settings?.activeQuarterId) {
        if (settings) {
          await ctx.db.patch(settings._id, { activeQuarterId: existing._id });
        } else {
          await ctx.db.insert("userSettings", { userId, activeQuarterId: existing._id });
        }
      }
      return null;
    }

    // Create current quarter
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const quarter = Math.floor(month / 3) + 1;
    const monthIndex = (quarter - 1) * 3;
    const firstDay = new Date(year, monthIndex, 1);
    const day = firstDay.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(firstDay);
    monday.setDate(firstDay.getDate() + diff);
    if (monday < firstDay) monday.setDate(monday.getDate() + 7);
    const startDate = monday.toISOString().split("T")[0];
    const label = `Q${quarter} ${year}`;

    const quarterId = await ctx.db.insert("quarters", {
      userId,
      label,
      year,
      quarter,
      startDate,
    });

    // Set as active
    await ctx.db.insert("userSettings", { userId, activeQuarterId: quarterId });

    // Seed default streams
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

    return quarterId;
  },
});

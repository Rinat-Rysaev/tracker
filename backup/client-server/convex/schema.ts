import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  quarters: defineTable({
    userId: v.id("users"),
    label: v.string(),
    year: v.number(),
    quarter: v.number(), // 1-4
    startDate: v.string(), // ISO date, Monday of W1
  })
    .index("by_user", ["userId"])
    .index("by_user_year_quarter", ["userId", "year", "quarter"]),

  userSettings: defineTable({
    userId: v.id("users"),
    activeQuarterId: v.optional(v.id("quarters")),
  }).index("by_user", ["userId"]),

  streams: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    order: v.number(),
    quarterId: v.id("quarters"),
  })
    .index("by_quarter", ["quarterId"])
    .index("by_user_quarter", ["userId", "quarterId"]),

  tasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    status: v.union(
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done"),
      v.literal("blocked")
    ),
    streamId: v.id("streams"),
    quarterId: v.id("quarters"),
    weekNumber: v.number(), // 1–13
    orderInCell: v.number(),
    orderInWeek: v.number(),
  })
    .index("by_quarter", ["quarterId"])
    .index("by_stream_week", ["streamId", "weekNumber"])
    .index("by_quarter_week", ["quarterId", "weekNumber"]),
});

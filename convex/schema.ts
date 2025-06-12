import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  links: defineTable({
    userId: v.string(),
    url: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    readingTime: v.optional(v.number()),
    source: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    originalApp: v.optional(v.string()), // 元のアプリ名（Instagram, Twitter等）
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_url", ["url"])
    .index("by_user_url", ["userId", "url"]),
});

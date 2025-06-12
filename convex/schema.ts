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
    thumbnail: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()), // 既存データとの互換性
    source: v.optional(v.string()), // 既存データとの互換性
    domain: v.optional(v.string()),
    siteName: v.optional(v.string()),
    readingTime: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    isRead: v.optional(v.boolean()),
    originalApp: v.optional(v.string()),
    sharedFrom: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_url", ["url"])
    .index("by_user_url", ["userId", "url"])
    .index("by_user_tags", ["userId", "tags"])
    .index("by_user_domain", ["userId", "domain"]),
});

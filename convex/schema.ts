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
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 現在のユーザー情報を取得
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", identity.subject)
      )
      .first();

    return user;
  },
});

// ユーザー情報を作成または更新
export const createOrUpdateUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("ユーザーが認証されていません");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", identity.subject)
      )
      .first();

    if (existingUser) {
      // 既存ユーザーの更新
      const updateData = {
        email: args.email,
        ...(args.name && { name: args.name }),
        ...(args.profileImage && { profileImage: args.profileImage }),
      };

      await ctx.db.patch(existingUser._id, updateData);
      return existingUser._id;
    } else {
      // 新規ユーザーの作成
      const newUser = await ctx.db.insert("users", {
        clerkUserId: identity.subject,
        email: args.email,
        ...(args.name && { name: args.name }),
        ...(args.profileImage && { profileImage: args.profileImage }),
        createdAt: Date.now(),
      });
      return newUser;
    }
  },
});

// ユーザープロフィールを更新
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("ユーザーが認証されていません");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("ユーザーが見つかりません");
    }

    const updateData = {
      ...(args.name && { name: args.name }),
      ...(args.profileImage && { profileImage: args.profileImage }),
    };

    if (Object.keys(updateData).length > 0) {
      await ctx.db.patch(user._id, updateData);
    }

    return user._id;
  },
});

// 全ユーザー数を取得（統計用）
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const totalUsers = await ctx.db.query("users").collect();

    return {
      totalUsers: totalUsers.length,
      registeredToday: totalUsers.filter(
        (user) => user.createdAt > Date.now() - 24 * 60 * 60 * 1000
      ).length,
    };
  },
});

// ユーザーを削除
export const deleteUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("ユーザーが認証されていません");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("ユーザーが見つかりません");
    }

    await ctx.db.delete(user._id);
    return { success: true };
  },
});

import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

interface SaveLinkArgs {
  userId: string;
  url: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  tags?: string[];
  readingTime?: number;
  source?: string;
  originalApp?: string;
}

export const saveLink = mutation({
  args: {
    url: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    readingTime: v.optional(v.number()),
    source: v.optional(v.string()),
    originalApp: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"links">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("認証が必要です");
    }

    const userId = identity.subject;
    const now = Date.now();

    // 既存のリンクをユーザーIDとURLで検索
    const existingLink = await ctx.db
      .query("links")
      .withIndex("by_user_url", (q) =>
        q.eq("userId", userId).eq("url", args.url)
      )
      .unique();

    if (existingLink) {
      // 既存のリンクが存在する場合は更新（undefinedの値は更新しない）
      const updateData: any = { updatedAt: now };
      if (args.title !== undefined) updateData.title = args.title;
      if (args.description !== undefined)
        updateData.description = args.description;
      if (args.thumbnailUrl !== undefined)
        updateData.thumbnailUrl = args.thumbnailUrl;
      if (args.tags !== undefined) updateData.tags = args.tags;
      if (args.readingTime !== undefined)
        updateData.readingTime = args.readingTime;
      if (args.source !== undefined) updateData.source = args.source;
      if (args.originalApp !== undefined)
        updateData.originalApp = args.originalApp;

      await ctx.db.patch(existingLink._id, updateData);

      return existingLink._id;
    } else {
      // 新しいリンクを作成（undefinedの値は設定しない）
      const insertData: any = {
        userId: userId,
        url: args.url,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      };
      if (args.title !== undefined) insertData.title = args.title;
      if (args.description !== undefined)
        insertData.description = args.description;
      if (args.thumbnailUrl !== undefined)
        insertData.thumbnailUrl = args.thumbnailUrl;
      if (args.tags !== undefined) insertData.tags = args.tags;
      if (args.readingTime !== undefined)
        insertData.readingTime = args.readingTime;
      if (args.source !== undefined) insertData.source = args.source;
      if (args.originalApp !== undefined)
        insertData.originalApp = args.originalApp;

      const linkId = await ctx.db.insert("links", insertData);

      return linkId;
    }
  },
});

export const getLink = query({
  args: { id: v.id("links") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserLinks = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      console.log("No identity found, returning empty array");
      return [];
    }

    const links = await ctx.db
      .query("links")
      .withIndex("by_user_created", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    return links;
  },
});

export const toggleReadStatus = mutation({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("認証が必要です");
    }

    const link = await ctx.db.get(args.linkId);
    if (!link) {
      throw new Error("リンクが見つかりません");
    }

    // リンクの所有者確認
    if (link.userId !== identity.subject) {
      throw new Error("このリンクを変更する権限がありません");
    }

    await ctx.db.patch(args.linkId, {
      isRead: !link.isRead,
      updatedAt: Date.now(),
    });

    return args.linkId;
  },
});

export const deleteLink = mutation({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("認証が必要です");
    }

    const link = await ctx.db.get(args.linkId);
    if (!link) {
      throw new Error("リンクが見つかりません");
    }

    // リンクの所有者確認
    if (link.userId !== identity.subject) {
      throw new Error("このリンクを削除する権限がありません");
    }

    await ctx.db.delete(args.linkId);

    return args.linkId;
  },
});

export const markAsRead = mutation({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("認証が必要です");
    }

    const link = await ctx.db.get(args.linkId);
    if (!link) {
      throw new Error("リンクが見つかりません");
    }

    // リンクの所有者確認
    if (link.userId !== identity.subject) {
      throw new Error("このリンクを変更する権限がありません");
    }

    await ctx.db.patch(args.linkId, {
      isRead: true,
      updatedAt: Date.now(),
    });

    return args.linkId;
  },
});

export const resetAllToUnread = mutation({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("認証が必要です");
    }

    const userId = identity.subject;
    const now = Date.now();

    // ユーザーの全てのリンクを未読に変更
    const userLinks = await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const updatePromises = userLinks.map(async (link) => {
      if (link.isRead) {
        return await ctx.db.patch(link._id, {
          isRead: false,
          updatedAt: now,
        });
      }
    });

    await Promise.all(updatePromises);

    return {
      message: "すべてのリンクを未読にリセットしました",
      count: userLinks.length,
    };
  },
});

// 初期データを投入するための関数
export const seedData = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const now = Date.now();

    // 既存のデータがあるかチェック
    const existingLinks = await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (existingLinks.length > 0) {
      return { message: "既にデータが存在します", count: existingLinks.length };
    }

    // サンプルデータを投入
    const sampleLinks = [
      // 今日の記事（4つ）
      {
        url: "https://example.com/article-1",
        title: "React Native の新機能について",
        description:
          "React Native の最新アップデートと新機能について詳しく解説します。",
        thumbnailUrl:
          "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=400",
        tags: ["react-native", "development", "technology"],
        readingTime: 8,
        source: "TechBlog",
        createdAt: now,
      },
      {
        url: "https://example.com/article-2",
        title: "TypeScript ベストプラクティス",
        description: "TypeScript を使った効率的な開発手法を紹介します。",
        thumbnailUrl:
          "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400",
        tags: ["typescript", "javascript", "development"],
        readingTime: 10,
        source: "Dev Weekly",
        createdAt: now,
      },
      {
        url: "https://example.com/article-3",
        title: "モバイルアプリデザインのトレンド",
        description:
          "2024年のモバイルアプリデザインで注目すべきトレンドについて",
        thumbnailUrl:
          "https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=400",
        tags: ["design", "mobile", "ui-ux"],
        readingTime: 6,
        source: "Design Trends",
        createdAt: now,
      },
      {
        url: "https://example.com/article-4",
        title: "AI を活用した開発ツール",
        description: "AI を使って開発効率を向上させる最新のツールについて紹介",
        thumbnailUrl:
          "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400",
        tags: ["ai", "tools", "productivity"],
        readingTime: 12,
        source: "AI Weekly",
        createdAt: now,
      },
      // 昨日の記事（2つ）
      {
        url: "https://example.com/article-5",
        title: "Webアクセシビリティの基本",
        description:
          "誰でも使いやすいWebサイトを作るためのアクセシビリティガイド",
        thumbnailUrl:
          "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=400",
        tags: ["accessibility", "web", "ux"],
        readingTime: 15,
        source: "UX Guide",
        createdAt: now - 24 * 60 * 60 * 1000,
      },
      {
        url: "https://example.com/article-6",
        title: "パフォーマンス最適化の手法",
        description:
          "Webアプリケーションのパフォーマンスを向上させる実践的な手法",
        thumbnailUrl:
          "https://images.pexels.com/photos/414102/pexels-photo-414102.jpeg?auto=compress&cs=tinysrgb&w=400",
        tags: ["performance", "optimization", "web"],
        readingTime: 9,
        source: "Performance Blog",
        createdAt: now - 24 * 60 * 60 * 1000,
      },
      // 既読記事（2つ）
      {
        url: "https://example.com/article-read-1",
        title: "Vue.js 3 の新機能",
        description: "Vue.js 3 で追加された新機能と従来バージョンからの変更点",
        thumbnailUrl:
          "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=400",
        tags: ["vue", "frontend", "javascript"],
        readingTime: 12,
        source: "Vue Weekly",
        createdAt: now - 7 * 24 * 60 * 60 * 1000,
        isRead: true,
      },
      {
        url: "https://example.com/article-read-2",
        title: "デザインシステムの構築",
        description: "大規模なプロダクトに対応するデザインシステムの作り方",
        thumbnailUrl:
          "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400",
        tags: ["design-system", "ui", "design"],
        readingTime: 20,
        source: "Design Systems",
        createdAt: now - 8 * 24 * 60 * 60 * 1000,
        isRead: true,
      },
    ];

    // バッチで挿入
    const insertPromises = sampleLinks.map(async (link) => {
      return await ctx.db.insert("links", {
        userId: userId,
        url: link.url,
        title: link.title,
        description: link.description,
        thumbnailUrl: link.thumbnailUrl,
        tags: link.tags,
        readingTime: link.readingTime,
        source: link.source,
        isRead: link.isRead || false,
        createdAt: link.createdAt,
        updatedAt: link.createdAt,
      });
    });

    await Promise.all(insertPromises);

    return {
      message: "サンプルデータを投入しました",
      count: sampleLinks.length,
    };
  },
});

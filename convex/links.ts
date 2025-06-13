import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const saveLink = mutation({
  args: {
    url: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    domain: v.optional(v.string()),
    siteName: v.optional(v.string()),
    readingTime: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    originalApp: v.optional(v.string()),
    sharedFrom: v.optional(v.string()),
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
      if (args.description !== undefined) updateData.description = args.description;
      if (args.thumbnail !== undefined) updateData.thumbnail = args.thumbnail;
      if (args.domain !== undefined) updateData.domain = args.domain;
      if (args.siteName !== undefined) updateData.siteName = args.siteName;
      if (args.readingTime !== undefined) updateData.readingTime = args.readingTime;
      if (args.tags !== undefined) updateData.tags = args.tags;
      if (args.originalApp !== undefined) updateData.originalApp = args.originalApp;
      if (args.sharedFrom !== undefined) updateData.sharedFrom = args.sharedFrom;

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
      if (args.description !== undefined) insertData.description = args.description;
      if (args.thumbnail !== undefined) insertData.thumbnail = args.thumbnail;
      if (args.domain !== undefined) insertData.domain = args.domain;
      if (args.siteName !== undefined) insertData.siteName = args.siteName;
      if (args.readingTime !== undefined) insertData.readingTime = args.readingTime;
      if (args.tags !== undefined) insertData.tags = args.tags;
      if (args.originalApp !== undefined) insertData.originalApp = args.originalApp;
      if (args.sharedFrom !== undefined) insertData.sharedFrom = args.sharedFrom;

      const linkId = await ctx.db.insert("links", insertData);

      return linkId;
    }
  },
});

// 基本的なメタデータ抽出を含むリンク保存
export const saveLinkWithMetadata = mutation({
  args: {
    url: v.string(),
    originalApp: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"links">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("認証が必要です");
    }

    const userId = identity.subject;
    const now = Date.now();

    // URLから基本的なメタデータを抽出
    const domain = extractDomainFromUrl(args.url);
    const { platform, estimatedReadingTime } = identifyPlatformFromUrl(args.url);
    
    // プラットフォーム情報から共有元を判定
    let sharedFrom = args.originalApp;
    if (platform === 'twitter' || platform === 'x') {
      sharedFrom = 'X (Twitter)';
    } else if (platform === 'instagram') {
      sharedFrom = 'Instagram';
    } else if (platform === 'safari' || !args.originalApp) {
      sharedFrom = 'Safari';
    }

    // 既存のリンクをチェック
    const existingLink = await ctx.db
      .query("links")
      .withIndex("by_user_url", (q) =>
        q.eq("userId", userId).eq("url", args.url)
      )
      .unique();

    if (existingLink) {
      // 既存のリンクを更新
      const updateData: any = { updatedAt: now };
      if (args.originalApp) updateData.originalApp = args.originalApp;
      if (sharedFrom) updateData.sharedFrom = sharedFrom;
      if (domain) updateData.domain = domain;
      if (estimatedReadingTime) updateData.readingTime = estimatedReadingTime;
      
      await ctx.db.patch(existingLink._id, updateData);
      return existingLink._id;
    } else {
      // 新しいリンクを作成
      const insertData: any = {
        userId: userId,
        url: args.url,
        domain,
        readingTime: estimatedReadingTime,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      };
      
      if (args.originalApp) insertData.originalApp = args.originalApp;
      if (sharedFrom) insertData.sharedFrom = sharedFrom;

      const linkId = await ctx.db.insert("links", insertData);
      return linkId;
    }
  },
});

// 既存のリンクにメタデータを追加する migration function
export const updateLinkMetadata = mutation({
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

    // URLから基本的なメタデータを抽出
    const domain = extractDomainFromUrl(link.url);
    const { platform, estimatedReadingTime } = identifyPlatformFromUrl(link.url);
    
    // プラットフォーム情報から共有元を判定
    let sharedFrom = link.originalApp;
    if (platform === 'twitter' || platform === 'x') {
      sharedFrom = 'X (Twitter)';
    } else if (platform === 'instagram') {
      sharedFrom = 'Instagram';
    } else if (platform === 'safari' || !link.originalApp) {
      sharedFrom = 'Safari';
    }

    // メタデータで更新
    const updateData: any = { updatedAt: Date.now() };
    if (domain && !link.domain) updateData.domain = domain;
    if (estimatedReadingTime && !link.readingTime) updateData.readingTime = estimatedReadingTime;
    if (sharedFrom && !link.sharedFrom) updateData.sharedFrom = sharedFrom;

    await ctx.db.patch(args.linkId, updateData);
    return args.linkId;
  },
});

// ユーザーの全リンクにメタデータを一括追加
export const migrateAllLinksMetadata = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("認証が必要です");
    }

    const userId = identity.subject;
    const links = await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const updatePromises = links.map(async (link) => {
      // メタデータが欠けているリンクのみ更新
      if (!link.domain || !link.readingTime || !link.sharedFrom) {
        const domain = extractDomainFromUrl(link.url);
        const { platform, estimatedReadingTime } = identifyPlatformFromUrl(link.url);
        
        let sharedFrom = link.originalApp;
        if (platform === 'twitter' || platform === 'x') {
          sharedFrom = 'X (Twitter)';
        } else if (platform === 'instagram') {
          sharedFrom = 'Instagram';
        } else if (platform === 'safari' || !link.originalApp) {
          sharedFrom = 'Safari';
        }

        const updateData: any = { updatedAt: Date.now() };
        if (domain && !link.domain) updateData.domain = domain;
        if (estimatedReadingTime && !link.readingTime) updateData.readingTime = estimatedReadingTime;
        if (sharedFrom && !link.sharedFrom) updateData.sharedFrom = sharedFrom;

        return await ctx.db.patch(link._id, updateData);
      }
    });

    await Promise.all(updatePromises);

    return {
      message: "メタデータの移行が完了しました",
      count: links.length,
    };
  },
});

// URLからドメインを抽出するヘルパー関数
function extractDomainFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    return url;
  }
}

// URLからプラットフォームと読書時間を推定するヘルパー関数
function identifyPlatformFromUrl(url: string): { platform: string; estimatedReadingTime: number } {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return { platform: hostname.includes('x.com') ? 'x' : 'twitter', estimatedReadingTime: 1 };
    }
    
    if (hostname.includes('instagram.com')) {
      return { platform: 'instagram', estimatedReadingTime: 1 };
    }
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return { platform: 'youtube', estimatedReadingTime: 10 };
    }
    
    if (hostname.includes('medium.com') || hostname.includes('dev.to') || hostname.includes('qiita.com')) {
      return { platform: 'article', estimatedReadingTime: 8 };
    }
    
    return { platform: 'safari', estimatedReadingTime: 5 };
  } catch {
    return { platform: 'safari', estimatedReadingTime: 5 };
  }
}

export const getLink = query({
  args: { id: v.id("links") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserLinks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
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
  handler: async (ctx) => {
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

// 全データをクリアする関数
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("認証が必要です");
    }

    const allLinks = await ctx.db.query("links").collect();
    
    for (const link of allLinks) {
      await ctx.db.delete(link._id);
    }

    return {
      message: "全データを削除しました",
      count: allLinks.length,
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
      {
        url: "https://example.com/article-1",
        title: "React Native の新機能について",
        createdAt: now,
      },
      {
        url: "https://example.com/article-2",
        title: "TypeScript ベストプラクティス",
        createdAt: now,
      },
      {
        url: "https://example.com/article-3",
        title: "モバイルアプリデザインのトレンド",
        createdAt: now,
      },
      {
        url: "https://example.com/article-4",
        title: "AI を活用した開発ツール",
        originalApp: "Safari",
        createdAt: now,
      },
      {
        url: "https://example.com/article-5",
        title: "Webアクセシビリティの基本",
        createdAt: now - 24 * 60 * 60 * 1000,
      },
      {
        url: "https://example.com/article-read-1",
        title: "Vue.js 3 の新機能",
        createdAt: now - 7 * 24 * 60 * 60 * 1000,
        isRead: true,
      },
    ];

    // バッチで挿入
    const insertPromises = sampleLinks.map(async (link) => {
      const insertData: any = {
        userId: userId,
        url: link.url,
        isRead: link.isRead || false,
        createdAt: link.createdAt,
        updatedAt: link.createdAt,
      };
      if (link.title !== undefined) insertData.title = link.title;
      if (link.originalApp !== undefined) insertData.originalApp = link.originalApp;
      
      return await ctx.db.insert("links", insertData);
    });

    await Promise.all(insertPromises);

    return {
      message: "サンプルデータを投入しました",
      count: sampleLinks.length,
    };
  },
});

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

interface LinkMetadata {
  title: string;
  description: string;
  thumbnailUrl?: string;
  summary?: string;
  readingTime?: number;
}

// OGタグからメタデータを取得する関数
async function fetchLinkMetadata(url: string): Promise<Partial<LinkMetadata>> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // シンプルな正規表現でOGタグを抽出
    const metadata: Partial<LinkMetadata> = {};

    // タイトルの取得
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                      html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // 説明の取得
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
                     html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }

    // サムネイル画像の取得
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (imageMatch) {
      metadata.thumbnailUrl = imageMatch[1].trim();
    }

    // 簡易的な読了時間の計算（本文の長さから推定）
    const bodyText = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(' ').length;
    const readingTimeMinutes = Math.ceil(wordCount / 200); // 1分間に200単語と仮定
    metadata.readingTime = readingTimeMinutes;

    return metadata;
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return {};
  }
}

// LLMを使用した要約生成（現時点ではプレースホルダー）
async function generateSummary(url: string, content?: string): Promise<string | undefined> {
  // TODO: Edge Runtime（Cloudflare Workers）でLLMを実行
  // 現時点ではプレースホルダーとして簡単な要約を返す
  return undefined;
}

export const fetchAndUpdateMetadata = action({
  args: {
    linkId: v.id("links"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // メタデータを取得
      const metadata = await fetchLinkMetadata(args.url);
      
      // 要約を生成（将来的に実装）
      const summary = await generateSummary(args.url);
      
      // リンクを更新
      const updateData: any = {};
      if (metadata.title) updateData.title = metadata.title;
      if (metadata.description) updateData.description = metadata.description;
      if (metadata.thumbnailUrl) updateData.thumbnailUrl = metadata.thumbnailUrl;
      if (metadata.readingTime) updateData.readingTime = metadata.readingTime;
      if (summary) updateData.summary = summary;
      
      // saveLinkミューテーションを使用して更新
      if (Object.keys(updateData).length > 0) {
        await ctx.runMutation(api.links.saveLink, {
          url: args.url,
          ...updateData,
        });
      }
      
      return {
        success: true,
        metadata: { ...metadata, summary },
      };
    } catch (error) {
      console.error("Failed to fetch metadata:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// URLから基本的な情報を抽出する補助関数
export const extractUrlInfo = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const urlObj = new URL(args.url);
      
      // ドメインから推定されるソース名
      const hostname = urlObj.hostname.replace('www.', '');
      const sourceName = hostname
        .split('.')
        .slice(0, -1)
        .join('.')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // URLからタイトルを推定（パスの最後の部分）
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const estimatedTitle = pathParts[pathParts.length - 1]
        ?.replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || hostname;
      
      return {
        source: sourceName,
        estimatedTitle,
        domain: hostname,
      };
    } catch (error) {
      return {
        source: "Unknown",
        estimatedTitle: args.url,
        domain: "unknown",
      };
    }
  },
});
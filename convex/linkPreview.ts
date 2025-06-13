import { v } from "convex/values";
import { action, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Link Preview取得のメイン関数
export const fetchLinkPreview = action({
  args: { 
    url: v.string(),
    linkId: v.optional(v.id("links"))
  },
  handler: async (ctx, { url, linkId }) => {
    try {
      console.log(`Fetching link preview for: ${url}`);
      
      // HTMLを取得
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ReadLaterBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        // タイムアウト設定
        signal: AbortSignal.timeout(10000), // 10秒
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // メタデータを抽出
      const metadata = extractMetadata(html, url);
      
      console.log('Extracted metadata:', metadata);

      // リンクIDが提供されていればデータベースを更新
      if (linkId) {
        await ctx.runMutation(internal.linkPreview.updateLinkWithPreview, {
          linkId,
          metadata
        });
      }

      return metadata;
    } catch (error) {
      console.error('Link preview fetch failed:', error);
      
      // エラーが発生した場合はドメインから基本情報を生成
      const fallbackMetadata = generateFallbackMetadata(url);
      
      if (linkId) {
        await ctx.runMutation(internal.linkPreview.updateLinkWithPreview, {
          linkId,
          metadata: fallbackMetadata
        });
      }
      
      return fallbackMetadata;
    }
  },
});

// 内部用: データベース更新関数
export const updateLinkWithPreview = internalMutation({
  args: {
    linkId: v.id("links"),
    metadata: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      thumbnail: v.optional(v.string()),
      siteName: v.optional(v.string()),
      domain: v.string(),
      favicon: v.optional(v.string()),
    })
  },
  handler: async (ctx, { linkId, metadata }) => {
    // 既存のリンクを取得
    const link = await ctx.db.get(linkId);
    
    if (!link) {
      throw new Error("Link not found");
    }

    // メタデータでリンクを更新（既存の値を上書きしない）
    const updateData: any = { 
      updatedAt: Date.now()
    };

    if (metadata.title && !link.title) {
      updateData.title = metadata.title;
    }
    if (metadata.description && !link.description) {
      updateData.description = metadata.description;
    }
    if (metadata.thumbnail && !link.thumbnail) {
      updateData.thumbnail = metadata.thumbnail;
    }
    if (metadata.siteName && !link.siteName) {
      updateData.siteName = metadata.siteName;
    }
    if (metadata.domain && !link.domain) {
      updateData.domain = metadata.domain;
    }

    await ctx.db.patch(linkId, updateData);

    return linkId;
  },
});

// スケジューラー用の内部action版
export const fetchLinkPreviewInternal = internalAction({
  args: { 
    url: v.string(),
    linkId: v.id("links")
  },
  handler: async (ctx, { url, linkId }) => {
    try {
      // X/Twitter URLの特別処理
      const domain = extractDomainFromUrl(url);
      if (domain.includes('x.com') || domain.includes('twitter.com')) {
        const fallbackMetadata = generateFallbackMetadata(url);
        await ctx.runMutation(internal.linkPreview.updateLinkWithPreview, {
          linkId,
          metadata: fallbackMetadata
        });
        return fallbackMetadata;
      }
      
      // HTMLを取得
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ReadLaterBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        // タイムアウト設定
        signal: AbortSignal.timeout(10000), // 10秒
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // メタデータを抽出
      const metadata = extractMetadata(html, url);

      // データベースを更新
      await ctx.runMutation(internal.linkPreview.updateLinkWithPreview, {
        linkId,
        metadata
      });

      return metadata;
    } catch (error) {
      // エラーが発生した場合はドメインから基本情報を生成
      const fallbackMetadata = generateFallbackMetadata(url);
      
      try {
        await ctx.runMutation(internal.linkPreview.updateLinkWithPreview, {
          linkId,
          metadata: fallbackMetadata
        });
      } catch (dbError) {
        // サイレントフェイル
      }
      
      return fallbackMetadata;
    }
  },
});


// HTMLからメタデータを抽出する関数
function extractMetadata(html: string, url: string) {
  // 簡単な正規表現ベースの抽出（本来はDOM parserを使うべき）
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  
  const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const twitterDescriptionMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  
  const ogSiteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  
  // faviconを抽出
  const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  
  // URLからドメインを抽出
  const domain = extractDomainFromUrl(url);
  
  // 優先順位: og:title > twitter:title > title
  const title = cleanText(
    ogTitleMatch?.[1] || 
    twitterTitleMatch?.[1] || 
    titleMatch?.[1] || 
    ""
  );
  
  // 優先順位: og:description > twitter:description > description
  const description = cleanText(
    ogDescriptionMatch?.[1] || 
    twitterDescriptionMatch?.[1] || 
    descriptionMatch?.[1] || 
    ""
  );
  
  // 優先順位: og:image > twitter:image
  let thumbnail = ogImageMatch?.[1] || twitterImageMatch?.[1] || "";
  
  // 相対URLを絶対URLに変換
  if (thumbnail && !thumbnail.startsWith('http')) {
    try {
      thumbnail = new URL(thumbnail, url).href;
    } catch {
      thumbnail = "";
    }
  }
  
  // faviconの絶対URL化
  let favicon = faviconMatch?.[1] || "";
  if (favicon && !favicon.startsWith('http')) {
    try {
      favicon = new URL(favicon, url).href;
    } catch {
      favicon = "";
    }
  }
  
  const siteName = cleanText(ogSiteNameMatch?.[1] || "");

  return {
    title: title || undefined,
    description: description || undefined,
    thumbnail: thumbnail || undefined,
    siteName: siteName || undefined,
    domain,
    favicon: favicon || undefined,
  };
}

// フォールバック用のメタデータ生成
function generateFallbackMetadata(url: string) {
  const domain = extractDomainFromUrl(url);
  
  // X/Twitter用の特別処理
  if (domain.includes('x.com') || domain.includes('twitter.com')) {
    // URLからユーザー名と投稿IDを抽出
    const urlParts = url.split('/');
    const userIndex = urlParts.findIndex(part => part === 'x.com' || part === 'twitter.com') + 1;
    const username = urlParts[userIndex];
    
    return {
      title: username ? `@${username}の投稿` : 'X (Twitter) の投稿',
      description: 'X (Twitter) からシェアされたコンテンツです',
      thumbnail: undefined,
      siteName: 'X (Twitter)',
      domain,
      favicon: undefined,
    };
  }
  
  return {
    title: `${domain}のページ`,
    description: `${domain}からのコンテンツです`,
    thumbnail: undefined,
    siteName: domain,
    domain,
    favicon: undefined,
  };
}

// URLからドメインを抽出
function extractDomainFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    return url;
  }
}

// テキストをクリーンアップ（HTMLエンティティのデコードなど）
function cleanText(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}
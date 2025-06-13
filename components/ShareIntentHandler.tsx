import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useShareIntent } from "expo-share-intent";
import { useCallback, useEffect } from "react";

export default function ShareIntentHandler() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const saveLinkWithMetadataMutation = useMutation(api.links.saveLinkWithMetadata);


  const handleShareIntent = useCallback(async () => {
    if (!shareIntent) return;

    try {
      let url = "";
      let originalApp = "Shared";

      // URLの抽出
      if (shareIntent.webUrl) {
        url = String(shareIntent.webUrl);
      } else if (shareIntent.text) {
        // テキストからURLを抽出
        const textStr = String(shareIntent.text);
        const urlMatch = textStr.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          url = urlMatch[0];
        } else {
          return; // 有効なURLなし
        }
      }

      if (url && url.trim()) {
        await saveLinkWithMetadataMutation({
          url: url.trim(),
          originalApp,
        });

        // 保存完了
      }
    } catch {
      // 保存失敗時の処理（必要に応じてユーザーに通知）
    } finally {
      resetShareIntent();
    }
  }, [shareIntent, saveLinkWithMetadataMutation, resetShareIntent]);

  useEffect(() => {
    if (hasShareIntent && shareIntent && typeof shareIntent === 'object') {
      handleShareIntent();
    }
  }, [hasShareIntent, shareIntent, handleShareIntent]);

  return null; // UIは表示しない
}
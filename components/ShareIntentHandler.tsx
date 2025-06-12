import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useShareIntent } from "expo-share-intent";
import { useCallback, useEffect } from "react";
import { Alert } from "react-native";

export default function ShareIntentHandler() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent();
  const saveLinkWithMetadataMutation = useMutation(api.links.saveLinkWithMetadata);

  useEffect(() => {
    if (hasShareIntent && shareIntent) {
      // shareIntentがundefinedや無効なJSONでないことを確認
      try {
        if (typeof shareIntent === 'object' && shareIntent !== null) {
          handleShareIntent();
        }
      } catch (error) {
        console.error("Share intent validation error:", error);
        resetShareIntent();
      }
    }
  }, [hasShareIntent, shareIntent, handleShareIntent, resetShareIntent]);

  const handleShareIntent = useCallback(async () => {
    if (!shareIntent) return;

    try {
      let url = "";
      let title = "";
      let originalApp = "Shared";

      // shareIntentオブジェクトの安全な処理
      const safeShareIntent = {
        webUrl: shareIntent.webUrl || "",
        text: shareIntent.text || "",
      };

      // URLの抽出
      if (safeShareIntent.webUrl) {
        url = String(safeShareIntent.webUrl);
        title = String(safeShareIntent.text) || "共有された記事";
      } else if (safeShareIntent.text) {
        // テキストからURLを抽出
        const textStr = String(safeShareIntent.text);
        const urlMatch = textStr.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          url = urlMatch[0];
          // URLの前後のテキストをタイトルとして使用
          title = textStr.replace(url, "").trim() || "共有された記事";
        } else {
          Alert.alert("エラー", "有効なURLが見つかりませんでした");
          return;
        }
      }

      if (url && url.trim()) {
        await saveLinkWithMetadataMutation({
          url: url.trim(),
          originalApp,
        });

        Alert.alert("保存完了", "記事を保存しました！");
      }
    } catch (error) {
      console.error("Share intent error:", error);
      // JSON parse errorを避けるために詳細なエラー情報は避ける
      Alert.alert("エラー", "記事の保存に失敗しました");
    } finally {
      resetShareIntent();
    }
  }, [shareIntent, saveLinkWithMetadataMutation, resetShareIntent]);

  // エラーハンドリング
  useEffect(() => {
    if (error) {
      console.error("Share intent error:", error);
      Alert.alert("エラー", "共有の処理中にエラーが発生しました");
    }
  }, [error]);

  return null; // UIは表示しない
}
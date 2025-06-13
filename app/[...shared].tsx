import { router, useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";

export default function SharedContentHandler() {
  const params = useLocalSearchParams();
  const [processing, setProcessing] = useState(true);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  
  useEffect(() => {
    // shareパスまたは古いdataUrl形式の場合は共有処理
    if (params.shared && Array.isArray(params.shared) && 
        (params.shared[0] === 'share' || params.shared[0].startsWith('dataUrl='))) {
      
      // 共有処理UIの表示タイミング制御
      const processingTimer = setTimeout(() => {
        setProcessing(false);
        setSavedSuccessfully(true);
      }, 2000);

      const redirectTimer = setTimeout(() => {
        router.replace("/(tabs)");
      }, 3500);

      return () => {
        clearTimeout(processingTimer);
        clearTimeout(redirectTimer);
      };
    } else if (params.shared && Array.isArray(params.shared) && params.shared[0] === '+not-found') {
      // +not-foundの場合は何もしない（無限ループ防止）
      return;
    } else {
      // それ以外は404ページにリダイレクト
      const timer = setTimeout(() => {
        router.replace("/+not-found");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [params]);

  // 共有処理の場合のローディング画面
  if (params.shared && Array.isArray(params.shared) && 
      (params.shared[0] === 'share' || params.shared[0].startsWith('dataUrl='))) {
    return (
      <>
        <Stack.Screen options={{ title: '記事を保存中', headerShown: false }} />
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: '#fff',
          paddingHorizontal: 40
        }}>
          {processing ? (
            <>
              <ActivityIndicator size="large" color="#007AFF" style={{ marginBottom: 24 }} />
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '600', 
                marginBottom: 12,
                textAlign: 'center',
                color: '#1D1D1F'
              }}>
                記事を保存しています
              </Text>
              <Text style={{ 
                fontSize: 16, 
                color: '#666',
                textAlign: 'center',
                lineHeight: 24
              }}>
                しばらくお待ちください...
              </Text>
            </>
          ) : savedSuccessfully ? (
            <>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#34C759',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24
              }}>
                <Text style={{ fontSize: 30, color: '#fff' }}>✓</Text>
              </View>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '600', 
                marginBottom: 12,
                textAlign: 'center',
                color: '#1D1D1F'
              }}>
                保存完了！
              </Text>
              <Text style={{ 
                fontSize: 16, 
                color: '#666',
                textAlign: 'center',
                lineHeight: 24
              }}>
                記事が正常に保存されました{'\n'}ホーム画面に移動します
              </Text>
            </>
          ) : null}
        </View>
      </>
    );
  }

  // その他のケース
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text>処理中...</Text>
    </View>
  );
}
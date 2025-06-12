import { useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  Platform,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface OAuthButtonProps {
  provider: "google" | "apple";
  onPress: () => void;
  title: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

WebBrowser.maybeCompleteAuthSession();

export function OAuthButton({
  provider,
  onPress,
  title,
  style,
  textStyle,
}: OAuthButtonProps) {
  return (
    <TouchableOpacity style={style} onPress={onPress}>
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
}

// 後方互換性のためのデフォルトエクスポート
interface LegacyOAuthButtonProps {
  strategy: "oauth_google" | "oauth_apple";
  children: React.ReactNode;
  style?: any;
  contentStyle?: any;
  labelStyle?: any;
}

function LegacyOAuthButton({
  strategy,
  children,
  style,
  contentStyle,
  labelStyle,
}: LegacyOAuthButtonProps) {
  React.useEffect(() => {
    if (Platform.OS !== "android") return;

    void WebBrowser.warmUpAsync();
    return () => {
      if (Platform.OS !== "android") return;

      void WebBrowser.coolDownAsync();
    };
  }, []);

  const { startOAuthFlow } = useOAuth({ strategy });

  const onPress = React.useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/", { scheme: "miniappdemo" }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("OAuth error:", err);
    }
  }, [startOAuthFlow]);

  return (
    <TouchableOpacity style={[style, contentStyle]} onPress={onPress}>
      <Text style={labelStyle}>{children}</Text>
    </TouchableOpacity>
  );
}

export default LegacyOAuthButton;

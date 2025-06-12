import { useOAuth } from "@clerk/clerk-expo";
import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OAuthButton } from "./OAuthButton";

export const AuthScreen = () => {
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({
    strategy: "oauth_apple",
  });

  const handleGoogleAuth = async () => {
    try {
      const { createdSessionId, setActive } = await startGoogleOAuth();

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      }
    } catch (error) {
      console.error("Google OAuth error:", error);
      Alert.alert("認証エラー", "Googleでのログインに失敗しました");
    }
  };

  const handleAppleAuth = async () => {
    try {
      const { createdSessionId, setActive } = await startAppleOAuth();

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      }
    } catch (error) {
      console.error("Apple OAuth error:", error);
      Alert.alert("認証エラー", "Appleでのログインに失敗しました");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ようこそ</Text>
          <Text style={styles.subtitle}>
            アカウントにログインしてご利用ください
          </Text>
        </View>

        <View style={styles.authSection}>
          <Text style={styles.sectionTitle}>ログイン方法を選択</Text>

          <View style={styles.buttonContainer}>
            <OAuthButton
              provider="google"
              onPress={handleGoogleAuth}
              title="Googleでログイン"
              style={styles.authButton}
              textStyle={styles.authButtonText}
            />

            <OAuthButton
              provider="apple"
              onPress={handleAppleAuth}
              title="Appleでログイン"
              style={[styles.authButton, styles.appleButton]}
              textStyle={[styles.authButtonText, styles.appleButtonText]}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#718096",
    textAlign: "center",
    lineHeight: 24,
  },
  authSection: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 24,
    textAlign: "center",
  },
  buttonContainer: {
    gap: 16,
  },
  authButton: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3748",
  },
  appleButton: {
    backgroundColor: "#000000",
  },
  appleButtonText: {
    color: "white",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    lineHeight: 20,
  },
});

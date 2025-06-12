import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";

export default function HomeScreen() {
  const { user: clerkUser } = useUser();
  const { signOut } = useAuth();

  // Convexからユーザーデータを取得
  const convexUser = useQuery(api.users.getCurrentUser);
  const userStats = useQuery(api.users.getUserStats);
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  // ユーザーデータの同期
  useEffect(() => {
    if (clerkUser && !convexUser) {
      const syncUser = async () => {
        try {
          await createOrUpdateUser({
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name: clerkUser.fullName || clerkUser.firstName || undefined,
            profileImage: clerkUser.imageUrl || undefined,
          });
        } catch (error) {
          console.error("Failed to sync user data:", error);
        }
      };
      syncUser();
    }
  }, [clerkUser, convexUser, createOrUpdateUser]);

  const handleSignOut = async () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error("Sign out error:", error);
          }
        },
      },
    ]);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>認証成功！</Text>
          <Text style={styles.subtitle}>
            ようこそ、{clerkUser?.firstName || "ユーザー"}さん
          </Text>
        </View>

        {/* Clerkのユーザー情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Clerk ユーザー情報</Text>
          <View style={styles.card}>
            {clerkUser?.imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: clerkUser.imageUrl }}
                  style={styles.profileImage}
                />
              </View>
            )}
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>メールアドレス:</Text>
              <Text style={styles.infoValue}>
                {clerkUser?.emailAddresses[0]?.emailAddress}
              </Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>名前:</Text>
              <Text style={styles.infoValue}>
                {clerkUser?.fullName ||
                  `${clerkUser?.firstName} ${clerkUser?.lastName}` ||
                  "なし"}
              </Text>
            </View>
          </View>
        </View>

        {/* Convexのユーザー情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗄️ Convex データベース情報</Text>
          <View style={styles.card}>
            {convexUser ? (
              <>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>DB ユーザーID:</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {convexUser._id}
                  </Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Clerk ID:</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {convexUser.clerkUserId}
                  </Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>DB登録日:</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(convexUser.createdAt)}
                  </Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>保存された名前:</Text>
                  <Text style={styles.infoValue}>
                    {convexUser.name || "なし"}
                  </Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>保存されたメール:</Text>
                  <Text style={styles.infoValue}>{convexUser.email}</Text>
                </View>
              </>
            ) : (
              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>ステータス:</Text>
                <Text style={styles.infoValue}>データ同期中...</Text>
              </View>
            )}
          </View>
        </View>

        {/* ユーザー統計情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 アプリ統計</Text>
          <View style={styles.card}>
            {userStats ? (
              <>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>総ユーザー数:</Text>
                  <Text style={styles.statsValue}>
                    {userStats.totalUsers}人
                  </Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>今日の新規登録:</Text>
                  <Text style={styles.statsValue}>
                    {userStats.registeredToday}人
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>統計:</Text>
                <Text style={styles.infoValue}>読み込み中...</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.description}>
          <Text style={styles.descriptionTitle}>
            🎉 Convex連携が動作中です！
          </Text>
          <Text style={styles.descriptionText}>
            ClerkとConvexが正常に連携し、ユーザー情報がデータベースに保存されています。
          </Text>
          <Text style={styles.descriptionText}>
            リアルタイムでデータベースから情報を取得・表示しています。
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSignOut}
          >
            <Text style={styles.primaryButtonText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 20,
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
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#4299e1",
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#2d3748",
    lineHeight: 22,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4299e1",
    lineHeight: 26,
  },
  description: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 12,
    textAlign: "center",
  },
  descriptionText: {
    fontSize: 16,
    color: "#4a5568",
    lineHeight: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#e53e3e",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#e53e3e",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});

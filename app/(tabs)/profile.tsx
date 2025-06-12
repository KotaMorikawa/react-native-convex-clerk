import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";

export default function ProfileScreen() {
  const { user: clerkUser } = useUser();
  const { signOut } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // Convexからユーザーデータを取得
  const convexUser = useQuery(api.users.getCurrentUser);
  const updateUserProfile = useMutation(api.users.updateUserProfile);
  const deleteUser = useMutation(api.users.deleteUser);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEditName = () => {
    setNewName(convexUser?.name || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert("エラー", "名前を入力してください");
      return;
    }

    try {
      await updateUserProfile({ name: newName.trim() });
      setIsEditingName(false);
      Alert.alert("成功", "名前を更新しました");
    } catch (error) {
      console.error("Failed to update name:", error);
      Alert.alert("エラー", "名前の更新に失敗しました");
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewName("");
  };

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

  const handleDeleteAccount = async () => {
    Alert.alert(
      "アカウント削除",
      "この操作は取り消せません。本当にアカウントを削除しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser();
              await signOut();
              Alert.alert("削除完了", "アカウントが削除されました");
            } catch (error) {
              console.error("Failed to delete account:", error);
              Alert.alert("エラー", "アカウントの削除に失敗しました");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>プロフィール</Text>
          <Text style={styles.subtitle}>アカウント情報と設定</Text>
        </View>

        {/* プロフィール画像とユーザー情報 */}
        <View style={styles.section}>
          <View style={styles.card}>
            {clerkUser?.imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: clerkUser.imageUrl }}
                  style={styles.profileImage}
                />
              </View>
            )}

            <View style={styles.nameSection}>
              <Text style={styles.sectionTitle}>表示名</Text>
              {isEditingName ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="名前を入力"
                    autoFocus
                  />
                  <View style={styles.editButtonContainer}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={handleCancelEdit}
                    >
                      <Text style={styles.secondaryButtonText}>キャンセル</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleSaveName}
                    >
                      <Text style={styles.primaryButtonText}>保存</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.nameContainer}>
                  <Text style={styles.nameText}>
                    {convexUser?.name || clerkUser?.fullName || "名前未設定"}
                  </Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditName}
                  >
                    <Text style={styles.editButtonText}>編集</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 基本情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📧 基本情報</Text>
          <View style={styles.card}>
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>メールアドレス</Text>
              <Text style={styles.infoValue}>
                {clerkUser?.emailAddresses[0]?.emailAddress}
              </Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>ユーザーID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {clerkUser?.id}
              </Text>
            </View>
          </View>
        </View>

        {/* データベース情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗄️ データベース情報</Text>
          <View style={styles.card}>
            {convexUser ? (
              <>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>DB登録日</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(convexUser.createdAt)}
                  </Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>DB ID</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {convexUser._id}
                  </Text>
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.infoLabel}>Clerk ID</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {convexUser.clerkUserId}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>ステータス</Text>
                <Text style={styles.infoValue}>データ同期中...</Text>
              </View>
            )}
          </View>
        </View>

        {/* アクションボタン */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ アカウント管理</Text>
          <View style={styles.card}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={handleSignOut}
              >
                <Text style={styles.logoutButtonText}>ログアウト</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.deleteButtonText}>アカウント削除</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#4299e1",
  },
  nameSection: {
    marginBottom: 20,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
    flex: 1,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#4299e1",
    borderRadius: 8,
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  editContainer: {
    gap: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f7fafc",
  },
  editButtonContainer: {
    flexDirection: "row",
    gap: 12,
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
  buttonContainer: {
    gap: 16,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: "#4299e1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    flex: 1,
    shadowColor: "#4299e1",
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
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    flex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: "#4a5568",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#f56565",
    shadowColor: "#f56565",
  },
  logoutButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  deleteButton: {
    backgroundColor: "#e53e3e",
    shadowColor: "#e53e3e",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});

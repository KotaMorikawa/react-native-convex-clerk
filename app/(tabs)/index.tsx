import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import AddLinkModal from "@/components/AddLinkModal";
import ReadLinksList from "@/components/home/ReadLinksList";
import RotatingCarousel from "@/components/home/RotatingCarousel";
import StackedList from "@/components/home/StackedList";
import { SavedLink } from "@/types";
import { parseError, showErrorAlert, isValidUrl } from "@/utils/errorHandling";
import { BookOpen, Filter, RotateCcw, Target } from "lucide-react-native";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // Convexからユーザーのリンクデータを取得
  const linksData = useQuery(api.links.getUserLinks);
  const saveLinkMutation = useMutation(api.links.saveLink);
  const saveLinkWithMetadataMutation = useMutation(api.links.saveLinkWithMetadata);
  const toggleReadStatusMutation = useMutation(api.links.toggleReadStatus);
  const deleteLinkMutation = useMutation(api.links.deleteLink);
  const markAsReadMutation = useMutation(api.links.markAsRead);
  const resetAllToUnreadMutation = useMutation(api.links.resetAllToUnread);
  const migrateAllLinksMetadataMutation = useMutation(api.links.migrateAllLinksMetadata);

  // Convexのデータ形式をSavedLink型に変換
  const links: SavedLink[] = useMemo(() => {
    if (!linksData) return [];

    return linksData.map((link) => ({
      id: link._id,
      title: link.title,
      url: link.url,
      description: link.description,
      thumbnail: link.thumbnail || link.thumbnailUrl, // 既存データとの互換性
      domain: link.domain,
      siteName: link.siteName,
      readingTime: link.readingTime,
      tags: link.tags,
      isRead: link.isRead || false,
      createdAt: new Date(link.createdAt),
      updatedAt: new Date(link.updatedAt),
      originalApp: link.originalApp,
      sharedFrom: link.sharedFrom,
    }));
  }, [linksData]);

  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"unread" | "read">("unread");
  const [fanExpandedLinks, setFanExpandedLinks] = useState<SavedLink[]>([]);
  const [showFanExpanded, setShowFanExpanded] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const scrollY = useSharedValue(0);

  const filteredLinks = useMemo(() => {
    let filtered = links;

    // タブによるフィルタリング
    if (activeTab === "unread") {
      filtered = filtered.filter((link) => !link.isRead);
    } else {
      filtered = filtered.filter((link) => link.isRead);
    }

    // タグによるフィルタリング
    if (selectedTags.length > 0) {
      filtered = filtered.filter((link) =>
        link.tags?.some((tag) => selectedTags.includes(tag))
      );
    }

    return filtered;
  }, [links, activeTab, selectedTags]);

  // 全タグのリストを取得
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    links.forEach((link) => {
      if (link.tags) {
        link.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [links]);

  const totalUnreadCount = links.filter((link) => !link.isRead).length;
  const totalReadCount = links.filter((link) => link.isRead).length;
  const totalCount = links.length;
  const progressPercentage =
    totalCount > 0 ? (totalReadCount / totalCount) * 100 : 0;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.9]);
    const translateY = interpolate(scrollY.value, [0, 100], [0, -10]);

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Convexは自動的にデータをrefreshするため、少し待機するだけ
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // データが読み込み中の場合
  if (linksData === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={[styles.emptyContainer, { paddingTop: 200 }]}>
          <Text style={styles.emptyText}>読み込み中...</Text>
          <Text style={styles.emptySubText}>データを取得しています</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLinkPress = async (link: SavedLink) => {
    // 未読タブの場合のみ既読にマーク
    if (activeTab === "unread" && !link.isRead) {
      try {
        await markAsReadMutation({ linkId: link.id as any });
      } catch (error) {
        console.error("Failed to mark as read:", error);
        const appError = parseError(error);
        showErrorAlert(appError, "既読にできませんでした");
      }
    }

    try {
      await Linking.openURL(link.url);
    } catch {
      showErrorAlert(
        { code: "INVALID_URL", message: "リンクを開けませんでした" },
        "エラー"
      );
    }
  };

  const handleLinkLongPressStart = (link: SavedLink) => {
    // 同じ日付のリンクを取得してカード展開
    const linkDate = link.createdAt.toISOString().split("T")[0];
    const sameDateLinks = filteredLinks.filter(
      (l) => l.createdAt.toISOString().split("T")[0] === linkDate
    );

    if (sameDateLinks.length > 1) {
      // 複数のカードがある場合のみ手札展開
      setFanExpandedLinks(sameDateLinks);
      setShowFanExpanded(true);
    }
    // 単独カードの場合は何もしない
  };

  const toggleReadStatus = async (id: string) => {
    try {
      await toggleReadStatusMutation({ linkId: id as any });
    } catch (error) {
      console.error("Failed to toggle read status:", error);
      const appError = parseError(error);
      showErrorAlert(appError, "ステータス更新エラー");
    }
  };

  const deleteLink = async (id: string) => {
    try {
      await deleteLinkMutation({ linkId: id as any });
    } catch (error) {
      console.error("Failed to delete link:", error);
      const appError = parseError(error);
      showErrorAlert(appError, "削除エラー");
    }
  };

  const handleAddLink = async (url: string) => {
    // URLの妥当性チェック
    if (!isValidUrl(url)) {
      showErrorAlert(
        { code: "INVALID_URL", message: "正しいURLを入力してください" },
        "無効なURL"
      );
      return;
    }

    try {
      await saveLinkWithMetadataMutation({
        url,
        originalApp: "Manual Input",
      });
      Alert.alert("成功", "リンクを保存しました！");
    } catch (error) {
      console.error("Failed to add link:", error);
      const appError = parseError(error);
      showErrorAlert(appError, "保存エラー");
    }
  };


  const resetAllToUnread = () => {
    Alert.alert("Reset Reading Progress", "Mark all articles as unread?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: async () => {
          try {
            await resetAllToUnreadMutation();
            Alert.alert("成功", "すべての記事を未読に戻しました");
          } catch (error) {
            console.error("Failed to reset all to unread:", error);
            const appError = parseError(error);
            showErrorAlert(appError, "リセットエラー");
          }
        },
      },
    ]);
  };

  const migrateMetadata = async () => {
    Alert.alert(
      "メタデータ更新",
      "既存のリンクにメタデータ（読書時間、ドメイン、共有元）を追加しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "更新",
          onPress: async () => {
            try {
              const result = await migrateAllLinksMetadataMutation();
              Alert.alert("成功", result.message);
            } catch (error) {
              console.error("Failed to migrate metadata:", error);
              const appError = parseError(error);
              showErrorAlert(appError, "移行エラー");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "read" && (
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            {/* Main Header */}
            <View style={styles.headerMain}>
              <View style={styles.titleSection}>
                <View style={styles.titleRow}>
                  <BookOpen
                    size={28}
                    color="#1C1C1E"
                    style={styles.titleIcon}
                  />
                  <Text style={styles.greeting}>Reading Stack</Text>
                </View>
                <Text style={styles.subtitle}>
                  Your curated collection of articles
                </Text>
              </View>
            </View>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <View style={styles.progressStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{totalUnreadCount}</Text>
                    <Text style={styles.statLabel}>Unread</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{totalReadCount}</Text>
                    <Text style={styles.statLabel}>Read</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{totalCount}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={resetAllToUnread}
                  >
                    <RotateCcw size={16} color="#8E8E93" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={migrateMetadata}
                  >
                    <Target size={16} color="#007AFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      showFilters && styles.activeIconButton,
                    ]}
                    onPress={() => setShowFilters(!showFilters)}
                  >
                    <Filter
                      size={16}
                      color={showFilters ? "#007AFF" : "#8E8E93"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { width: `${progressPercentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(progressPercentage)}% completed
                </Text>
              </View>

              {/* Tag Filters */}
              {showFilters && allTags.length > 0 && (
                <View style={styles.filtersSection}>
                  <Text style={styles.filterTitle}>タグでフィルター</Text>
                  <View style={styles.tagFilters}>
                    {allTags.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.tagFilter,
                          selectedTags.includes(tag) && styles.activeTagFilter,
                        ]}
                        onPress={() =>
                          setSelectedTags((prev) =>
                            prev.includes(tag)
                              ? prev.filter((t) => t !== tag)
                              : [...prev, tag]
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.tagFilterText,
                            selectedTags.includes(tag) && styles.activeTagFilterText,
                          ]}
                        >
                          #{tag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {selectedTags.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearFiltersButton}
                      onPress={() => setSelectedTags([])}
                    >
                      <Text style={styles.clearFiltersText}>フィルターをクリア</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Stack Visualization */}
              <View style={styles.stackVisualization}>
                <View style={styles.stackBars}>
                  {[...Array(Math.min(totalUnreadCount, 8))].map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.stackBar,
                        {
                          height: 4 + index * 2,
                          opacity: 1 - index * 0.1,
                          marginLeft: index * 2,
                        },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.stackLabel}>
                  <Target size={12} color="#8E8E93" />
                  <Text style={styles.stackLabelText}>
                    {totalUnreadCount > 0
                      ? `${totalUnreadCount} articles stacked`
                      : "Stack cleared!"}
                  </Text>
                </View>
              </View>
            </View>

          </Animated.View>
        )}

        <View style={styles.stackContainer}>
          {activeTab === "unread" ? (
            filteredLinks.length > 0 ? (
              <StackedList
                links={filteredLinks}
                onLinkPress={handleLinkPress}
                onLinkLongPress={handleLinkLongPressStart}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>未読記事がありません</Text>
                <Text style={styles.emptySubText}>
                  新しい記事を追加してスタックを作りましょう
                </Text>
              </View>
            )
          ) : (
            <ReadLinksList
              links={filteredLinks}
              onLinkPress={handleLinkPress}
              onLinkLongPress={handleLinkLongPressStart}
            />
          )}
        </View>
      </Animated.ScrollView>

      <AddLinkModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddLink}
      />

      <RotatingCarousel
        visible={showFanExpanded}
        links={fanExpandedLinks}
        onClose={() => setShowFanExpanded(false)}
        onCardPress={handleLinkPress}
      />

      {/* Fixed Bottom Tab */}
      <View
        style={[
          styles.bottomTabContainer,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <View style={styles.bottomTabWrapper}>
          <TouchableOpacity
            style={[
              styles.bottomTab,
              activeTab === "unread" && styles.activeBottomTab,
            ]}
            onPress={() => setActiveTab("unread")}
          >
            <Text
              style={[
                styles.bottomTabText,
                activeTab === "unread" && styles.activeBottomTabText,
              ]}
            >
              未読
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bottomTab,
              activeTab === "read" && styles.activeBottomTab,
            ]}
            onPress={() => setActiveTab("read")}
          >
            <Text
              style={[
                styles.bottomTabText,
                activeTab === "read" && styles.activeBottomTabText,
              ]}
            >
              既読
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  headerMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 24,
    paddingBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1C1C1E",
  },
  subtitle: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "500",
    lineHeight: 20,
  },

  progressSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E5E5EA",
    marginHorizontal: 20,
  },
  actionButtons: {
    flexDirection: "row",
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  activeIconButton: {
    backgroundColor: "#E1F5FE",
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#F2F2F7",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "600",
    textAlign: "center",
  },
  stackVisualization: {
    alignItems: "center",
  },
  stackBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 24,
    marginBottom: 8,
  },
  stackBar: {
    width: 16,
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  stackLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackLabelText: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
    marginLeft: 4,
  },
  filtersSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
    marginTop: 16,
    paddingTop: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 12,
  },
  tagFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tagFilter: {
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  activeTagFilter: {
    backgroundColor: "#007AFF",
  },
  tagFilterText: {
    fontSize: 12,
    color: "#6D6D80",
    fontWeight: "500",
  },
  activeTagFilterText: {
    color: "#FFFFFF",
  },
  clearFiltersButton: {
    alignSelf: "flex-start",
  },
  clearFiltersText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  stackContainer: {
    paddingTop: 20,
    paddingBottom: 100, // ボトムタブ分のスペースを確保
  },
  bottomTabContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: "transparent",
    alignItems: "center",
    zIndex: 1000,
  },
  bottomTabWrapper: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 3,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    width: 140,
  },
  bottomTab: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBottomTab: {
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activeBottomTabText: {
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 20,
  },
  addButton: {
    position: "absolute",
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

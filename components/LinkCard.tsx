import { SavedLink } from "@/types";
import { Clock, ExternalLink } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface LinkCardProps {
  link: SavedLink;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function LinkCard({
  link,
  onPress,
  onLongPress,
}: LinkCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, link.isRead && styles.readContainer]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* サムネイル画像 */}
      {link.thumbnail && (
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: link.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.content}>
        <Text
          style={[styles.title, link.isRead && styles.readTitle]}
          numberOfLines={2}
        >
          {link.title || link.url}
        </Text>

        {/* 記事の概要 */}
        {link.description && (
          <Text
            style={[styles.description, link.isRead && styles.readDescription]}
            numberOfLines={2}
          >
            {link.description}
          </Text>
        )}

        <View style={styles.metadata}>
          <View style={styles.metadataRow}>
            {/* 読書時間 */}
            {link.readingTime && (
              <View style={styles.readingTime}>
                <Clock size={10} color="#8E8E93" />
                <Text style={styles.readingTimeText}>{link.readingTime}分</Text>
              </View>
            )}

            {/* ドメイン/サイト名 */}
            {(link.siteName || link.domain) && (
              <View style={styles.source}>
                <ExternalLink size={10} color="#8E8E93" />
                <Text style={styles.sourceText}>
                  {link.siteName || link.domain}
                </Text>
              </View>
            )}

            {/* 共有元プラットフォーム */}
            {link.sharedFrom && (
              <View style={styles.platform}>
                <Text style={styles.platformText}>via {link.sharedFrom}</Text>
              </View>
            )}

            <Text style={styles.date}>
              {link.createdAt.toLocaleDateString("ja-JP", {
                month: "numeric",
                day: "numeric",
              })}
            </Text>
          </View>

          {/* タグ表示 */}
          {link.tags && link.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {link.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
              {link.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{link.tags.length - 3}</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {link.isRead && <View style={styles.readIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
    flexDirection: "row",
  },
  readContainer: {
    opacity: 0.8,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
    lineHeight: 18,
  },
  readTitle: {
    color: "#8E8E93",
  },
  description: {
    fontSize: 12,
    color: "#6D6D80",
    lineHeight: 16,
    marginBottom: 8,
  },
  readDescription: {
    color: "#8E8E93",
  },
  metadata: {
    flex: 1,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  readingTime: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 2,
  },
  readingTimeText: {
    fontSize: 10,
    color: "#8E8E93",
    marginLeft: 2,
  },
  source: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 2,
  },
  sourceText: {
    fontSize: 10,
    color: "#8E8E93",
    marginLeft: 2,
  },
  platform: {
    marginRight: 12,
    marginBottom: 2,
  },
  platformText: {
    fontSize: 9,
    color: "#007AFF",
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 9,
    color: "#6D6D80",
    fontWeight: "500",
  },
  moreTagsText: {
    fontSize: 9,
    color: "#8E8E93",
    fontWeight: "500",
  },
  date: {
    fontSize: 10,
    color: "#8E8E93",
  },
  readIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34C759",
  },
});

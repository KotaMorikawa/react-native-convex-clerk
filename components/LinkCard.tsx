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
      {link.thumbnailUrl && (
        <Image source={{ uri: link.thumbnailUrl }} style={styles.thumbnail} />
      )}

      <View style={styles.content}>
        <Text
          style={[styles.title, link.isRead && styles.readTitle]}
          numberOfLines={2}
        >
          {link.title}
        </Text>

        <View style={styles.metadata}>
          <View style={styles.metadataRow}>
            {link.readingTime && (
              <View style={styles.readingTime}>
                <Clock size={10} color="#8E8E93" />
                <Text style={styles.readingTimeText}>{link.readingTime}分</Text>
              </View>
            )}

            {link.source && (
              <View style={styles.source}>
                <ExternalLink size={10} color="#8E8E93" />
                <Text style={styles.sourceText}>{link.source}</Text>
              </View>
            )}

            <Text style={styles.date}>
              {link.createdAt.toLocaleDateString("ja-JP", {
                month: "numeric",
                day: "numeric",
              })}
            </Text>
          </View>

          {link.tags.length > 0 && (
            <View style={styles.tags}>
              <Text style={styles.tagsText} numberOfLines={1}>
                {link.tags.slice(0, 2).join(", ")}
              </Text>
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
  thumbnail: {
    width: 60,
    height: 60,
    backgroundColor: "#F2F2F7",
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
    marginBottom: 6,
    lineHeight: 18,
  },
  readTitle: {
    color: "#8E8E93",
  },
  metadata: {
    flex: 1,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  readingTime: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
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
  },
  sourceText: {
    fontSize: 10,
    color: "#8E8E93",
    marginLeft: 2,
  },
  tags: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagsText: {
    fontSize: 10,
    color: "#8E8E93",
    flex: 1,
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

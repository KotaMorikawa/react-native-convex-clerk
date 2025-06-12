import LinkCard from "@/components/LinkCard";
import { SavedLink } from "@/types";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface ReadLinksListProps {
  links: SavedLink[];
  onLinkPress: (link: SavedLink) => void;
  onLinkLongPress: (link: SavedLink) => void;
}

export default function ReadLinksList({
  links,
  onLinkPress,
  onLinkLongPress,
}: ReadLinksListProps) {
  if (links.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>既読記事がありません</Text>
        <Text style={styles.emptySubText}>
          記事を読んでここに表示させましょう
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {links.map((link) => (
        <LinkCard
          key={link.id}
          link={link}
          onPress={() => onLinkPress(link)}
          onLongPress={() => onLinkLongPress(link)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

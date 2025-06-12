import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

export default function TagFilter({
  tags,
  selectedTags,
  onTagToggle,
}: TagFilterProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, isSelected && styles.selectedTag]}
              onPress={() => onTagToggle(tag)}
            >
              <Text
                style={[styles.tagText, isSelected && styles.selectedTagText]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  tag: {
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  selectedTag: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  selectedTagText: {
    color: "#FFFFFF",
  },
});

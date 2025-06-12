import { SavedLink } from "@/types";
import React, { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import StackedLinkCard from "./StackedLinkCard";

interface StackedListProps {
  links: SavedLink[];
  onLinkPress: (link: SavedLink) => void;
  onLinkLongPress: (link: SavedLink) => void;
}

const { height: screenHeight } = Dimensions.get("window");

// 日付別グループの型定義
interface DateGroup {
  date: string;
  displayDate: string;
  links: SavedLink[];
}

// 個別のカードコンポーネント
function AnimatedCard({
  link,
  stackIndex,
  totalItems,
  onPress,
  onLongPress,
}: {
  link: SavedLink;
  stackIndex: number;
  totalItems: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const translateY = useSharedValue(-screenHeight);

  useEffect(() => {
    const delay = stackIndex * 150;
    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 15,
        stiffness: 100,
        mass: 1,
      })
    );
  }, [stackIndex, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handlePress = () => {
    if (!link.isRead) {
      translateY.value = withSpring(
        screenHeight,
        {
          damping: 20,
          stiffness: 150,
        },
        () => {
          runOnJS(onPress)();
        }
      );
    } else {
      onPress();
    }
  };

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <StackedLinkCard
        link={link}
        onPress={handlePress}
        onLongPress={onLongPress}
        stackIndex={stackIndex}
        totalItems={totalItems}
      />
    </Animated.View>
  );
}

// 日付グループコンポーネント
function DateGroupStack({
  group,
  groupIndex,
  onLinkPress,
  onLinkLongPress,
}: {
  group: DateGroup;
  groupIndex: number;
  onLinkPress: (link: SavedLink) => void;
  onLinkLongPress: (link: SavedLink) => void;
}) {
  // グループ内のカード数に基づいて動的に高さを計算
  const maxStackOffset = Math.max(0, (group.links.length - 1) * 2);
  const dynamicHeight = 120 + maxStackOffset;

  // グループ間の一定間隔を確保
  const groupSpacing = 40;
  const calculatedMarginTop = groupIndex === 0 ? 0 : groupSpacing;

  return (
    <View
      style={[
        styles.groupContainer,
        {
          marginTop: calculatedMarginTop,
          height: dynamicHeight,
        },
      ]}
    >
      <View style={[styles.stackContainer, { height: dynamicHeight }]}>
        {group.links.map((link, index) => (
          <AnimatedCard
            key={link.id}
            link={link}
            stackIndex={index}
            totalItems={group.links.length}
            onPress={() => onLinkPress(link)}
            onLongPress={() => onLinkLongPress(link)}
          />
        ))}
      </View>
    </View>
  );
}

export default function StackedList({
  links = [],
  onLinkPress,
  onLinkLongPress,
}: StackedListProps) {
  // 日付別にグルーピング
  const groupedLinks = useMemo(() => {
    const groups: { [key: string]: SavedLink[] } = {};

    links.forEach((link) => {
      const dateKey = link.createdAt.toISOString().split("T")[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(link);
    });

    // 日付順にソート（新しい順）
    const sortedGroups: DateGroup[] = Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, groupLinks]) => {
        const linkDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let displayDate: string;
        if (linkDate.toDateString() === today.toDateString()) {
          displayDate = `今日 (${groupLinks.length})`;
        } else if (linkDate.toDateString() === yesterday.toDateString()) {
          displayDate = `昨日 (${groupLinks.length})`;
        } else {
          displayDate = `${linkDate.toLocaleDateString("ja-JP", {
            month: "numeric",
            day: "numeric",
          })} (${groupLinks.length})`;
        }

        return {
          date,
          displayDate,
          links: groupLinks,
        };
      });

    return sortedGroups;
  }, [links]);

  return (
    <View style={styles.container}>
      {groupedLinks.map((group, groupIndex) => (
        <DateGroupStack
          key={group.date}
          group={group}
          groupIndex={groupIndex}
          onLinkPress={onLinkPress}
          onLinkLongPress={onLinkLongPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    paddingTop: 20,
  },
  groupContainer: {
    position: "relative",
    marginBottom: 20,
  },
  stackContainer: {
    position: "relative",
    height: 120,
  },
  cardWrapper: {
    position: "absolute",
    width: "100%",
    height: 120,
  },
});

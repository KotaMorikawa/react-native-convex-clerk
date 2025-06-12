import { SavedLink } from "@/types";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// 個別のカルーセルカードコンポーネント
interface CarouselCardProps {
  link: SavedLink;
  index: number;
  totalCards: number;
  scrollY: Animated.SharedValue<number>;
  cardsScale: Animated.SharedValue<number>;
  onPress: () => void;
  onBackgroundPress: () => void;
  currentIndex: number;
}

function CarouselCard({
  link,
  index,
  totalCards,
  scrollY,
  cardsScale,
  onPress,
  onBackgroundPress,
  currentIndex,
}: CarouselCardProps) {
  const cardHeight = 160;
  const cardSpacing = 60; // 間隔を狭める
  const itemHeight = cardHeight + cardSpacing;

  const animatedCardStyle = useAnimatedStyle(() => {
    const progress = cardsScale.value;

    // 縦向きカルーセルの配置（シンプルな縦列配置）
    const baseTranslateY =
      (index - Math.round(scrollY.value / itemHeight)) * itemHeight;

    // 中央からの距離を計算（共通で使用）
    const distanceFromCenter = Math.abs(scrollY.value - index * itemHeight);

    // 中央からの距離に応じたX軸のオフセット（奥行き効果）
    const distanceRatio = distanceFromCenter / itemHeight;
    const translateX = interpolate(
      distanceRatio,
      [0, 1, 2],
      [0, 15, 30], // 回転半径を半分に縮小
      "clamp"
    );

    // 3D効果のための軽微な回転（Y軸回転を最小限に）
    const direction = scrollY.value > index * itemHeight ? 1 : -1;
    const rotateY = interpolate(
      distanceFromCenter,
      [0, itemHeight, 2 * itemHeight],
      [0, 8 * direction, 15 * direction],
      "clamp"
    );

    // スケール効果（中央が最大） - 距離ベースで確実に計算
    const scale = interpolate(
      distanceFromCenter,
      [0, itemHeight, 2 * itemHeight],
      [1, 0.8, 0.6],
      "clamp"
    );

    // 透明度効果（距離ベースで確実に計算）
    const opacity = interpolate(
      distanceFromCenter,
      [0, itemHeight, 2 * itemHeight],
      [1.0, 0.5, 0.3], // より強い透明度差
      "clamp"
    );

    // Z-indexの調整（中央が最前面）
    const zIndex = interpolate(
      distanceFromCenter,
      [0, itemHeight, 2 * itemHeight],
      [100, 2, 1],
      "clamp"
    );

    return {
      transform: [
        { translateX: translateX * progress },
        { translateY: baseTranslateY * progress },
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale: scale * progress },
      ],
      opacity: opacity * progress,
      zIndex: Math.round(zIndex),
    };
  });

  const cardBackgroundStyle = useAnimatedStyle(() => {
    // 動的なinputRange（リストの境界を考慮、特に最初と最後のカード）
    let inputRange: number[];

    if (index === 0) {
      // 最初のカードの特別処理
      inputRange = [
        -itemHeight, // 仮想の前のカード位置
        0, // 現在のカード位置
        itemHeight, // 次のカード位置
      ];
    } else if (index === totalCards - 1) {
      // 最後のカードの特別処理
      inputRange = [
        (index - 1) * itemHeight,
        index * itemHeight,
        (totalCards - 1) * itemHeight + itemHeight, // 仮想の次のカード位置
      ];
    } else {
      // 中間のカードの通常処理
      inputRange = [
        (index - 1) * itemHeight,
        index * itemHeight,
        (index + 1) * itemHeight,
      ];
    }

    // 背景色を滑らかに変化させる（境界でも適切に処理）
    const backgroundColor = interpolateColor(scrollY.value, inputRange, [
      "rgba(255, 255, 255, 0.7)",
      "rgba(255, 255, 255, 1.0)",
      "rgba(255, 255, 255, 0.7)",
    ]);

    // 選択中のカードには青い境界線、それ以外は薄いグレー
    const borderColor = interpolateColor(scrollY.value, inputRange, [
      "rgba(224, 224, 224, 0.3)",
      "#007AFF", // 選択中は青い境界線
      "rgba(224, 224, 224, 0.3)",
    ]);

    // 選択中のカードの境界線を太くする
    const borderWidth = interpolate(
      scrollY.value,
      inputRange,
      [1, 3, 1], // 選択中は3px、その他は1px
      "clamp"
    );

    const shadowOpacity = interpolate(
      scrollY.value,
      inputRange,
      [0.05, 0.4, 0.05], // 選択中の影を強く
      "clamp"
    );

    return {
      backgroundColor,
      borderColor,
      borderWidth,
      shadowOpacity,
    };
  });

  // テキスト色のアニメーション（選択中は黒、非選択中はグレー）
  const titleColorStyle = useAnimatedStyle(() => {
    let inputRange: number[];

    if (index === 0) {
      inputRange = [-itemHeight, 0, itemHeight];
    } else if (index === totalCards - 1) {
      inputRange = [
        (index - 1) * itemHeight,
        index * itemHeight,
        (totalCards - 1) * itemHeight + itemHeight,
      ];
    } else {
      inputRange = [
        (index - 1) * itemHeight,
        index * itemHeight,
        (index + 1) * itemHeight,
      ];
    }

    const color = interpolateColor(scrollY.value, inputRange, [
      "#8E8E93", // 非選択時はグレー
      "#1C1C1E", // 選択中は黒
      "#8E8E93", // 非選択時はグレー
    ]);

    return {
      color,
    };
  });

  const sourceColorStyle = useAnimatedStyle(() => {
    let inputRange: number[];

    if (index === 0) {
      inputRange = [-itemHeight, 0, itemHeight];
    } else if (index === totalCards - 1) {
      inputRange = [
        (index - 1) * itemHeight,
        index * itemHeight,
        (totalCards - 1) * itemHeight + itemHeight,
      ];
    } else {
      inputRange = [
        (index - 1) * itemHeight,
        index * itemHeight,
        (index + 1) * itemHeight,
      ];
    }

    const color = interpolateColor(scrollY.value, inputRange, [
      "#C7C7CC", // 非選択時はより薄いグレー
      "#8E8E93", // 選択中は通常のグレー
      "#C7C7CC", // 非選択時はより薄いグレー
    ]);

    return {
      color,
    };
  });

  const handleCardPress = () => {
    // 選択中のカードのみリンク遷移、それ以外は背景タップと同じ動作
    if (index === currentIndex) {
      onPress();
    } else {
      onBackgroundPress();
    }
  };

  return (
    <Animated.View style={[styles.carouselCard, animatedCardStyle]}>
      <Animated.View style={[styles.cardContainer, cardBackgroundStyle]}>
        <TouchableOpacity onPress={handleCardPress} style={styles.cardTouchable}>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.textContent}>
                <Animated.Text 
                  style={[
                    styles.cardTitle, 
                    titleColorStyle
                  ]} 
                  numberOfLines={2}
                >
                  {link.title || link.url}
                </Animated.Text>
                <View style={styles.metadata}>
                  {/* 読書時間 */}
                  {link.readingTime && (
                    <View style={styles.readingTime}>
                      <Text style={styles.metadataText}>{link.readingTime}分</Text>
                    </View>
                  )}
                  
                  {/* ドメイン/サイト名 */}
                  {(link.siteName || link.domain) && (
                    <View style={styles.domainContainer}>
                      <Text style={styles.metadataText}>
                        {link.siteName || link.domain}
                      </Text>
                    </View>
                  )}
                  
                  {/* 共有元プラットフォーム */}
                  {link.sharedFrom && (
                    <Text style={styles.sharedFrom}>via {link.sharedFrom}</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.date}>
                {link.createdAt.toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              <Animated.Text 
                style={[
                  styles.cardSource, 
                  sourceColorStyle
                ]}
              >
                {link.originalApp || "Web Article"}
              </Animated.Text>
            </View>
          </View>
        </TouchableOpacity>

        {link.isRead && <View style={styles.readIndicator} />}
      </Animated.View>
    </Animated.View>
  );
}

interface RotatingCarouselProps {
  visible: boolean;
  links: SavedLink[];
  onClose: () => void;
  onCardPress: (link: SavedLink) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function RotatingCarousel({
  visible,
  links,
  onClose,
  onCardPress,
}: RotatingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const backdropOpacity = useSharedValue(0);
  const cardsScale = useSharedValue(0);
  const cardsTranslateY = useSharedValue(screenHeight);
  const scrollY = useSharedValue(0);

  const cardHeight = 160;
  const cardSpacing = 60; // 間隔を狭める
  const itemHeight = cardHeight + cardSpacing;

  useEffect(() => {
    if (visible) {
      // 状態を即座に初期化（アニメーションなし）
      setCurrentIndex(0);
      scrollY.value = 0; // 即座にリセットして表示時の不整合を防ぐ
      
      // その他の要素は通常通りアニメーション
      backdropOpacity.value = withSpring(1, { damping: 20, stiffness: 150 });
      cardsScale.value = withSpring(1, { damping: 15, stiffness: 100 });
      cardsTranslateY.value = withSpring(0, { damping: 20, stiffness: 120 });
    } else {
      // 非表示時も状態をリセット（次回表示時の一貫性確保）
      setCurrentIndex(0);
      scrollY.value = 0;
      
      // 収束アニメーション
      backdropOpacity.value = withSpring(0, { damping: 20, stiffness: 150 });
      cardsScale.value = withSpring(0, { damping: 15, stiffness: 100 });
      cardsTranslateY.value = withSpring(50, {
        damping: 20,
        stiffness: 120,
      });
    }
    // scrollYはSharedValueなので依存配列に含める必要がない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, links.length, backdropOpacity, cardsScale, cardsTranslateY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardsScale.value },
      { translateY: cardsTranslateY.value },
    ],
  }));

  const handleBackdropPress = () => {
    onClose();
  };

  const handleCardPress = (link: SavedLink) => {
    // カードクリック時はモーダルを閉じてからリンクを開く
    onClose();
    setTimeout(() => onCardPress(link), 100);
  };

  // カード切り替え時の振動フィードバック
  const triggerHapticFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 縦向きスクロールジェスチャー
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      "worklet";
      const newScrollY = scrollY.value - event.translationY * 0.1;
      const maxScroll = (links.length - 1) * itemHeight;

      // スクロール範囲を制限
      if (newScrollY >= 0 && newScrollY <= maxScroll) {
        scrollY.value = newScrollY;
      }

      // 現在のインデックスを計算
      const index = Math.round(scrollY.value / itemHeight);
      if (index !== currentIndex && index >= 0 && index < links.length) {
        runOnJS(setCurrentIndex)(index);
        runOnJS(triggerHapticFeedback)(); // カード切り替え時に振動
      }
    })
    .onEnd((event) => {
      "worklet";
      // 最も近いカードにスナップ
      const targetIndex = Math.round(scrollY.value / itemHeight);
      const clampedIndex = Math.max(0, Math.min(targetIndex, links.length - 1));

      scrollY.value = withSpring(clampedIndex * itemHeight, {
        damping: 120, // より高いダンピングでゆっくりに
        stiffness: 12, // より低いスティフネスでゆっくりに
      });

      // 最終位置のインデックスを確実に同期
      runOnJS(setCurrentIndex)(clampedIndex);
      if (clampedIndex !== currentIndex) {
        runOnJS(triggerHapticFeedback)();
      }
    });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar backgroundColor="transparent" barStyle="light-content" />

        {/* ブラーバックドロップ */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <BlurView intensity={50} style={StyleSheet.absoluteFill}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={handleBackdropPress}
              activeOpacity={1}
            />
          </BlurView>
        </Animated.View>

        {/* カード展開エリア */}
        <TouchableOpacity 
          style={styles.containerWrapper} 
          onPress={handleBackdropPress}
          activeOpacity={1}
        >
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.container, containerStyle]}>
              {/* ヘッダー */}
              <TouchableOpacity 
                style={styles.header}
                onPress={(e) => e.stopPropagation()}
                activeOpacity={1}
              >
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>
                    カードを選択 ({currentIndex + 1}/{links.length})
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    上下にスワイプしてカードを選択
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* カルーセルエリア */}
              <TouchableOpacity 
                style={styles.carouselContainer}
                onPress={(e) => e.stopPropagation()}
                activeOpacity={1}
              >
                {links.map((link, index) => (
                  <CarouselCard
                    key={link.id}
                    link={link}
                    index={index}
                    totalCards={links.length}
                    scrollY={scrollY}
                    cardsScale={cardsScale}
                    onPress={() => handleCardPress(link)}
                    onBackgroundPress={handleBackdropPress}
                    currentIndex={currentIndex}
                  />
                ))}
              </TouchableOpacity>

              {/* インジケーター */}
              <TouchableOpacity 
                style={styles.indicators}
                onPress={(e) => e.stopPropagation()}
                activeOpacity={1}
              >
                {links.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      {
                        backgroundColor:
                          index === currentIndex
                            ? "rgba(255, 255, 255, 0.9)"
                            : "rgba(255, 255, 255, 0.3)",
                        height: index === currentIndex ? 20 : 8,
                      },
                    ]}
                  />
                ))}
              </TouchableOpacity>

              {/* フッター */}
              <TouchableOpacity 
                style={styles.footerContainer}
                onPress={(e) => e.stopPropagation()}
                activeOpacity={1}
              >
                <Text style={styles.footerText}>
                  3D回転カルーセルでカードを選択
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </GestureDetector>
        </TouchableOpacity>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  containerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 40,
    paddingHorizontal: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  carouselContainer: {
    width: screenWidth,
    height: 400,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  carouselCard: {
    position: "absolute",
    width: 300,
    left: (screenWidth - 300) / 2,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    width: 300,
    height: 160,
  },
  cardContent: {
    padding: 16,
    height: 160,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  textContent: {
    flex: 1,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  readingTime: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  domainContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  metadataText: {
    fontSize: 11,
    color: "#8E8E93",
  },
  sharedFrom: {
    fontSize: 10,
    color: "#007AFF",
    fontWeight: "500",
  },
  date: {
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "500",
  },
  readIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34C759",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    lineHeight: 24,
    marginBottom: 8,
  },
  cardSource: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "600",
  },
  cardTouchable: {
    width: "100%",
  },
  indicators: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    width: 20,
  },
  indicator: {
    width: 8,
    borderRadius: 4,
    marginVertical: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    fontWeight: "500",
  },
});

import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4299e1",
        tabBarInactiveTintColor: "#a0aec0",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderTopWidth: 1,
            borderTopColor: "#e2e8f0",
            paddingTop: 12,
            paddingBottom: 34,
            height: 90,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          default: {
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#e2e8f0",
            paddingTop: 12,
            paddingBottom: 12,
            height: 70,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ホーム",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 30 : 28}
              name="house.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "プロフィール",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 30 : 28}
              name="person.fill"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

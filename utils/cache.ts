import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Clerkのトークンキャッシュ実装
// iOSとAndroidでSecure Storeを使用し、Webでは標準ストレージを使用
const createTokenCache = () => {
  return {
    async getToken(key: string) {
      try {
        if (Platform.OS !== "web") {
          return SecureStore.getItemAsync(key);
        } else {
          return localStorage.getItem(key);
        }
      } catch (error) {
        console.error("Token cache get error:", error);
        return null;
      }
    },
    async saveToken(key: string, value: string) {
      try {
        if (Platform.OS !== "web") {
          return SecureStore.setItemAsync(key, value);
        } else {
          return localStorage.setItem(key, value);
        }
      } catch (error) {
        console.error("Token cache save error:", error);
      }
    },
    async clearToken(key: string) {
      try {
        if (Platform.OS !== "web") {
          return SecureStore.deleteItemAsync(key);
        } else {
          return localStorage.removeItem(key);
        }
      } catch (error) {
        console.error("Token cache clear error:", error);
      }
    },
  };
};

export const tokenCache = createTokenCache();

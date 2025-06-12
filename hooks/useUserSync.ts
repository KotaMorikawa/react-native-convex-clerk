import { useUser } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";

export function useUserSync() {
  const { user, isLoaded } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  useEffect(() => {
    // ユーザーがロードされ、認証されている場合のみ実行
    if (isLoaded && user) {
      const syncUser = async () => {
        try {
          await createOrUpdateUser({
            email: user.emailAddresses[0]?.emailAddress || "",
            name: user.fullName || user.firstName || undefined,
            profileImage: user.imageUrl || undefined,
          });
        } catch (error) {
          console.error("Failed to sync user data:", error);
        }
      };

      syncUser();
    }
  }, [isLoaded, user, createOrUpdateUser]);

  return { user, isLoaded };
}

import { Alert } from "react-native";

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export const ErrorCodes = {
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  DUPLICATE_LINK: "DUPLICATE_LINK",
  INVALID_URL: "INVALID_URL",
  CONVEX_ERROR: "CONVEX_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export const ErrorMessages = {
  [ErrorCodes.NETWORK_ERROR]: "ネットワークエラーが発生しました。接続を確認してください。",
  [ErrorCodes.AUTH_ERROR]: "認証エラーが発生しました。再度ログインしてください。",
  [ErrorCodes.DUPLICATE_LINK]: "このリンクは既に保存されています。",
  [ErrorCodes.INVALID_URL]: "無効なURLです。正しいURLを入力してください。",
  [ErrorCodes.CONVEX_ERROR]: "データベースエラーが発生しました。",
  [ErrorCodes.UNKNOWN_ERROR]: "予期しないエラーが発生しました。",
} as const;

export function parseError(error: any): AppError {
  // Convexのエラーをチェック
  if (error?.data?.code === "invalid_args") {
    if (error.data.message?.includes("duplicate")) {
      return {
        code: ErrorCodes.DUPLICATE_LINK,
        message: ErrorMessages[ErrorCodes.DUPLICATE_LINK],
        details: error.data,
      };
    }
  }

  // ネットワークエラーをチェック
  if (error?.code === "NETWORK_ERROR" || error?.message?.includes("network")) {
    return {
      code: ErrorCodes.NETWORK_ERROR,
      message: ErrorMessages[ErrorCodes.NETWORK_ERROR],
      details: error,
    };
  }

  // 認証エラーをチェック
  if (error?.code === 401 || error?.message?.includes("auth")) {
    return {
      code: ErrorCodes.AUTH_ERROR,
      message: ErrorMessages[ErrorCodes.AUTH_ERROR],
      details: error,
    };
  }

  // Convexエラー
  if (error?.data?.code || error?.message?.includes("Convex")) {
    return {
      code: ErrorCodes.CONVEX_ERROR,
      message: ErrorMessages[ErrorCodes.CONVEX_ERROR],
      details: error,
    };
  }

  // デフォルトエラー
  return {
    code: ErrorCodes.UNKNOWN_ERROR,
    message: ErrorMessages[ErrorCodes.UNKNOWN_ERROR],
    details: error,
  };
}

export function showErrorAlert(error: AppError, title = "エラー") {
  Alert.alert(title, error.message, [{ text: "OK" }]);
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}
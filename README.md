# Mini App Demo - 認証付きReact Nativeアプリ

このプロジェクトは、React NativeでConvexとClerkを連携させた認証システムのデモアプリです。

## 🎯 主な機能

- **認証システム**: Google・Apple OAuth認証
- **セキュアなトークン管理**: Expo Secure Storeを使用
- **認証状態の管理**: Clerkを使った自動認証状態管理
- **プライベートページ**: 認証後にのみアクセス可能なページ
- **プロフィール画面**: ユーザー情報の詳細表示
- **ログアウト機能**: 安全なログアウト処理
- **🆕 Convexデータベース連携**: ユーザー情報の保存・取得・更新
- **🆕 リアルタイムデータ**: ユーザー統計の表示
- **🆕 プロフィール編集**: ユーザー名の編集機能
- **🆕 アカウント削除**: データベースからのユーザー削除

## 🏗️ 技術スタック

- **React Native** + **Expo**
- **Convex** - リアルタイムデータベース
- **Clerk** - 認証プロバイダー
- **React Query** - データ状態管理
- **React Native Paper** - UI コンポーネント
- **TypeScript** - 型安全性

## 🗄️ Convexデータベース機能

### ユーザーデータ管理

- **自動同期**: Clerk認証後、ユーザー情報が自動的にConvexデータベースに保存
- **リアルタイム取得**: 保存されたユーザー情報をリアルタイムで表示
- **プロフィール編集**: ユーザー名の編集と更新
- **統計情報**: 総ユーザー数、今日の新規登録数の表示
- **アカウント削除**: ユーザーデータの完全削除

### 実装されたConvex関数

```typescript
// convex/users.ts
- getCurrentUser: 現在のユーザー情報を取得
- createOrUpdateUser: ユーザー情報の作成または更新
- updateUserProfile: プロフィール情報の更新
- getUserStats: ユーザー統計情報の取得
- deleteUser: ユーザーの削除
```

## 📋 必要な設定

### 1. 環境変数の設定

`.env.local` ファイルが既に作成されている場合は、以下の値が設定されています：

```env
# Convex設定
EXPO_PUBLIC_CONVEX_URL=https://your-convex-url.convex.cloud

# Clerk設定
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_FRONTEND_API_URL=https://your-app.clerk.accounts.dev
```

### 2. Clerkの設定

1. [Clerk Dashboard](https://dashboard.clerk.com/) でアプリケーションを作成
2. OAuth プロバイダー（Google・Apple）を有効化
3. Redirect URL に以下を追加：
   - `miniappdemo://`
   - `exp://localhost:8081/` (開発時)

### 3. Convexの設定

1. [Convex Dashboard](https://dashboard.convex.dev/) でプロジェクトを作成
2. 認証設定で Clerk との連携を有効化

## 🚀 開発環境の起動

### 必要パッケージのインストール

```bash
npm install
```

### Convexの初期化・同期

```bash
npx convex dev
```

### アプリの起動

```bash
npm run dev
```

## 📱 使用方法

### 1. 認証フロー

1. アプリを起動すると認証画面が表示されます
2. 「Googleでサインイン」または「Appleでサインイン」を選択
3. OAuth認証フローが開始されます
4. 認証成功後、自動的にメインアプリに遷移します
5. **🆕 ユーザー情報が自動的にConvexデータベースに保存されます**

### 2. 認証後の機能

- **ホームタブ**:
  - Clerkユーザー情報の表示
  - **🆕 Convexデータベース情報の表示**
  - **🆕 アプリ統計情報（総ユーザー数、今日の新規登録数）**
  - ログアウト機能
- **探索タブ**: 既存のExploreページ
- **プロフィールタブ**:
  - 詳細なユーザー情報（作成日、プロバイダー等）
  - **🆕 プロフィール編集機能（名前の変更）**
  - **🆕 アカウント削除機能**

### 3. データベース連携の確認

認証後、以下の情報が表示されることで連携を確認できます：

- **DB ユーザーID**: Convexで生成されたユニークID
- **Clerk ID**: ClerkのユーザーID
- **DB登録日**: データベースに保存された日時
- **保存された情報**: 名前、メールアドレスなど

### 4. プロフィール編集

1. プロフィールタブから「編集」ボタンをタップ
2. 名前を変更
3. 「保存」ボタンでデータベースに反映

### 5. ログアウト・アカウント削除

各ページのボタンから安全にログアウト・アカウント削除できます。

## 🏗️ アーキテクチャ

### 認証・データ同期フロー

```
ユーザー → AuthScreen → Clerk OAuth → Convex認証 →
ユーザーデータ自動保存 → メインアプリ → リアルタイムデータ表示
```

### コンポーネント構成

```
app/
├── _layout.tsx          # 認証プロバイダーの設定
├── (tabs)/
│   ├── index.tsx        # ホーム画面（認証後、Convexデータ表示）
│   ├── profile.tsx      # プロフィール画面（編集・削除機能）
│   └── _layout.tsx      # タブナビゲーション

components/
├── AuthScreen.tsx       # 認証画面
└── OAuthButton.tsx      # OAuth認証ボタン

convex/
├── auth.config.ts       # Convex認証設定
├── schema.ts           # データベーススキーマ
└── users.ts            # 🆕 ユーザーCRUD操作

utils/
└── cache.ts            # トークンキャッシュ
```

## 🔐 セキュリティ機能

- **セキュアストレージ**: 認証トークンはExpo Secure Storeで安全に保存
- **自動リフレッシュ**: トークンの自動更新
- **認証状態管理**: SignedIn/SignedOutコンポーネントで安全な画面遷移
- **HTTPS通信**: すべての通信がHTTPS経由
- **🆕 認証済みユーザーのみアクセス**: ConvexのすべてのCRUD操作は認証必須

## 🛠️ カスタマイズ

### 新しい認証プロバイダーの追加

`components/AuthScreen.tsx` で新しいOAuthButtonを追加：

```tsx
<OAuthButton strategy="oauth_github">GitHubでサインイン</OAuthButton>
```

### 認証後ページの追加

1. `app/(tabs)/` に新しいページを作成
2. `app/(tabs)/_layout.tsx` にタブ設定を追加

### 🆕 新しいConvex関数の追加

1. `convex/` フォルダに新しい `.ts` ファイルを作成
2. 必要に応じて `convex/schema.ts` でテーブルを定義
3. `npx convex dev` でデプロイ

### 🆕 ユーザーデータの拡張

`convex/schema.ts` でusersテーブルに新しいフィールドを追加：

```typescript
users: defineTable({
  clerkUserId: v.string(),
  email: v.string(),
  name: v.optional(v.string()),
  profileImage: v.optional(v.string()),
  createdAt: v.number(),
  // 新しいフィールドを追加
  bio: v.optional(v.string()),
  preferences: v.optional(v.object({
    theme: v.string(),
    notifications: v.boolean(),
  })),
}).index("by_clerk_user_id", ["clerkUserId"]),
```

## 📝 トラブルシューティング

### よくある問題

1. **認証がうまく動作しない**

   - `.env.local` の設定を確認
   - Clerkのredirect URLを確認
   - app.jsonのscheme設定を確認

2. **Convexとの接続エラー**

   - `npx convex dev` が正常に動作するか確認
   - Convex URLが正しく設定されているか確認

3. **OAuth認証でリダイレクトできない**

   - app.json の scheme設定を確認
   - ClerkのRedirect URL設定を確認

4. **🆕 データベースにユーザー情報が保存されない**

   - Convex認証設定を確認
   - ブラウザのコンソールでエラーログを確認
   - Convex Dashboardでデータベースの状態を確認

5. **🆕 プロフィール編集・削除ができない**
   - ユーザーが正しく認証されているか確認
   - Convex関数のエラーログを確認

## 📚 参考資料

- [Clerk Documentation](https://clerk.com/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Convex + Clerk Integration](https://docs.convex.dev/auth/clerk)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)

---

このプロジェクトは認証付きアプリの基本的な構造とデータベース連携を示すデモです。本番環境では、さらなるセキュリティ設定、エラーハンドリング、機能追加をご検討ください。

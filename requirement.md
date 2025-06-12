# 後で読むリストアプリ 要件定義書 v0.2

**（React Native + Clerk + Convex 版）**
作成日: 2025-06-10

---

## 1. 目的

スマートフォンで見つけた投稿・ニュース・Web ページを **ワンタップで保存し、あとで一覧からディープリンクで再閲覧** できる体験を提供する。共有シートを利用し、OS の制約内で最小限の操作フローを実現する。

---

## 2. 対象プラットフォーム

- **iOS 17 以降**
- **Android 9 以降**

React Native（Expo）で単一コードベースを採用する。

---

## 3. ユーザーストーリー（主要）

| ID    | ユーザーストーリー                                                     | 優先度 |
| ----- | ---------------------------------------------------------------------- | ------ |
| US‑01 | 他アプリの共有シートから「後で読むに追加」を選択し URL を保存できる    | ★★★    |
| US‑02 | 保存時にタイトル・サムネイル・要約が自動付与され一覧で確認できる       | ★★☆    |
| US‑03 | 一覧のアイテムをタップすると元アプリ／ブラウザに遷移する               | ★★★    |
| US‑04 | Safari（iOS）では Action Button → ショートカットでワンタップ追加できる | ★★☆    |
| US‑05 | タグ・検索・推奨順で目的のアイテムを素早く見つけられる                 | ★★☆    |
| US‑06 | オフライン環境でも要約とサムネイルを閲覧できる                         | ★☆☆    |

---

## 4. 機能要件

### 4.1 保存フロー

| ID    | 詳細                                                                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR‑01 | **react-native-share-extension** により Share Extension（iOS）／Share Target（Android）を実装。payload を Convex Function `saveLink` に送信する。 |
| FR‑02 | 共有スキームが独自 URI の場合は正規化関数で Web URL へ変換。不可ならそのまま保存。                                                                |
| FR‑03 | 重複 URL は Convex の `uniqueIndex` で排他制御し、更新日時のみ更新する。                                                                          |

### 4.2 メタデータ生成（LLM 利用）

| ID    | 詳細                                                                                            |
| ----- | ----------------------------------------------------------------------------------------------- |
| FR‑04 | Convex Action で link preview API を呼び出し、タイトル・OG 画像を取得する。                     |
| FR‑05 | Edge Runtime（Cloudflare Workers）で LLM を実行し、本文要約とタグを抽出して Convex に保存する。 |

### 4.3 一覧／閲覧

| ID    | 詳細                                                                                                |
| ----- | --------------------------------------------------------------------------------------------------- |
| FR‑06 | React Native FlatList で無限スクロール（Convex pagination）を実装。                                 |
| FR‑07 | アイテムタップで `Linking.openURL()` を呼び、Universal Link／Intent を発火する。                    |
| FR‑08 | アイテム長押しで ActionSheet（react-native-bottom-sheet）を表示し、共有・削除・タグ編集を提供する。 |

### 4.4 認証・同期・ショートカット

| ID    | 詳細                                                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------- |
| FR‑09 | **Clerk React Native SDK** で Email／OAuth（Apple, Google, X）ログインを提供。                                  |
| FR‑10 | Convex Subscription hook (`useQuery`) で他デバイスとリアルタイム同期。                                          |
| FR‑11 | iOS App Intent をネイティブモジュールで公開し、Action Button に割り当て可能な `AddToReadingListIntent` を実装。 |

---

## 5. 非機能要件

| カテゴリ     | 指標                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| レスポンス   | 保存操作は 1 秒以内にトースト表示、メタデータ生成は非同期で 10 秒以内完了                                 |
| オフライン   | Convex offline mutation queue + SQLite cache（expo‑sqlite）で要約・サムネイル閲覧可                       |
| セキュリティ | Clerk セッション JWT + Convex RBAC。保存データは端末内暗号化ストレージに格納し、通信は TLS 1.2 以上を使用 |
| 可観測性     | Convex Logging + Sentry React Native でクラッシュ & パフォーマンスを計測                                  |
| CI/CD        | Expo EAS Build と OTA Updates。GitHub Actions で PR ごとに preview build 生成                             |

---

## 6. 主要画面遷移（概要）

```
Share Extension ─▶ Convex.saveLink ─▶ Toast
                                 │
                    (sub) Edge LLM 要約
                                 ▼
          HomeList ─▶ DetailModal ─▶ Linking.openURL()
```

---

## 7. 技術スタック

| レイヤ         | 技術                                                                             |
| -------------- | -------------------------------------------------------------------------------- |
| フロント       | React Native (TypeScript, Expo), React Navigation v7, react‑native‑paper         |
| 認証           | Clerk React Native SDK                                                           |
| バックエンド   | Convex Functions・Mutations・Queries・Storage                                    |
| AI/LLM         | Edge Runtime (Cloudflare Workers) + GPT‑4o または Gemini Pro                     |
| ネイティブ拡張 | react‑native‑share‑extension, iOS App Intent Module, Android Direct Share Module |
| テスト         | Jest, React Native Testing Library, Detox (E2E)                                  |

---

## 8. 今後の検討事項

1. Web（Next.js + Clerk + Convex）版ブックマークレット／ブラウザ拡張とのデータ統合
2. LLM の **on‑device** 実行（Apple Intelligence / Gemini Nano）でオフライン要約を高速化
3. Convex Cron によるリマインダ機能（例: 保存から 3 日経過した未読リンクを通知）

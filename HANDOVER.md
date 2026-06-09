# Zubora Kitchen — 引継ぎ資料

作成日: 2026-06-07  
最終更新: 2026-06-08

---

## 1. プロジェクト概要

**Zubora Kitchen** は食材・レシピ管理 Web アプリケーション。  
食材の期限管理、AIによるレシピ自動生成、料理履歴の記録を中心機能とする。

### 主な機能

| 機能 | 説明 |
|---|---|
| 食材管理 | 手動入力・レシート撮影・冷蔵庫撮影から食材を追加。期限・数量を管理 |
| レシピ管理 | レシピの作成・編集・削除。調理回数・最終調理日を記録 |
| AIレシピ生成 | 在庫食材を選択すると Gemini がレシピを提案。品数（1〜4品）指定に対応 |
| AI食材認識 | レシートまたは冷蔵庫の写真から食材を自動抽出 |
| 料理履歴 | 「作った！」報告で履歴記録 + 使用食材の在庫を自動減算 |
| ダッシュボード | 期限間近食材・最近の料理を一覧表示 |
| 設定 | テーマ（ライト/ダーク/システム）・通知日数を設定 |

---

## 2. 技術スタック

| カテゴリ | ライブラリ | バージョン |
|---|---|---|
| フレームワーク | Next.js (App Router) | 16.2.2 |
| UI | React | 19.2.4 |
| スタイリング | Tailwind CSS | v4 |
| 言語 | TypeScript | ^5 |
| データベース | Neon PostgreSQL (`@neondatabase/serverless`) | ^1.1.0 |
| AI SDK | Vercel AI SDK | ^6.0.197 |
| AIプロバイダー | Google Gemini (`@ai-sdk/google`) | ^3.0.80 |
| バリデーション | Zod | ^4.4.3 |
| パッケージマネージャー | pnpm | — |

---

## 3. 環境構築

### 前提条件
- Node.js 18 以上
- pnpm

### 手順

```bash
# 依存インストール
pnpm install

# 環境変数設定（下記を参照）
cp .env.example .env  # ※ .env.example は存在しないので手動作成

# DBマイグレーション
pnpm tsx scripts/migrate.ts

# 開発サーバー起動
pnpm dev
```

### 必要な環境変数 (`.env`)

```env
# Neon PostgreSQL（必須）
DATABASE_URL=postgresql://...

# Google Gemini API（AI機能に必須）
GEMINI_API_KEY=AIzaSy...   # Google AI Studio (aistudio.google.com/apikey) で取得
```

> **注意:** `GEMINI_API_KEY` は Google AI Studio で取得した `AIzaSy...` 形式のキーを使用すること。  
> Google Cloud Console で発行したキー（`AQ.` 形式）は無料枠が適用されず動作しない。

### AI モデル

現在 `gemini-2.5-flash` を使用。無料枠: **5 RPM / 20 RPD**。  
使用ルート:
- `app/api/recipes/ai-generate/route.ts`（AIレシピ生成）
- `app/api/ingredients/analyze-receipt/route.ts`（レシート解析 — **2回呼び出し**）
- `app/api/ingredients/analyze-fridge/route.ts`（冷蔵庫解析）

> レシート解析は OCR + 食材識別の2ステップで Gemini を**2回**呼び出す。1回の解析で 2 RPM を消費する点に注意。

---

## 4. ディレクトリ構造

```
food-manage/
├── app/
│   ├── layout.tsx                  # ルートレイアウト（ThemeProvider / AuthProvider）
│   ├── page.tsx                    # ダッシュボード
│   ├── globals.css                 # CSS変数（ライト/ダークテーマ）
│   ├── _components/
│   │   └── AppShell.tsx            # 共通ナビ・サイドバー・クイックステータス
│   ├── (auth)/                     # 認証不要ページ群
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── password/
│   │       ├── forgot/page.tsx
│   │       └── reset/[token]/page.tsx
│   ├── ingredients/
│   │   ├── page.tsx                # 食材一覧（編集・削除対応）
│   │   └── new/
│   │       ├── page.tsx            # 追加方法選択
│   │       ├── manual/page.tsx     # 手動入力
│   │       ├── receipt/page.tsx    # レシート撮影（実装済み）
│   │       └── fridge/page.tsx     # 冷蔵庫撮影（実装済み）
│   ├── recipes/
│   │   ├── page.tsx                # レシピ一覧 + 料理履歴
│   │   ├── new/page.tsx            # レシピ作成
│   │   ├── [recipeId]/
│   │   │   ├── page.tsx            # レシピ詳細・「作った！」ボタン
│   │   │   └── edit/page.tsx       # レシピ編集
│   │   └── _components/
│   │       └── RecipeForm.tsx      # AI生成フォーム（品数・人数・strictモード切替）
│   ├── settings/
│   │   ├── page.tsx                # 設定（テーマ・通知）
│   │   └── profile/page.tsx        # プロフィール編集
│   └── api/
│       ├── _lib/
│       │   ├── http.ts             # requireUser / errorResponse / jsonResponse 等
│       │   ├── store.ts            # DB行→型変換関数（rowToIngredient 等）
│       │   └── schemas.ts          # Zod スキーマ（RecipeContentSchema / MultipleRecipesSchema 等）
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── signup/route.ts
│       │   ├── password/route.ts   # パスワード変更
│       │   └── password-reset/route.ts
│       ├── me/
│       │   ├── route.ts            # プロフィール CRUD
│       │   └── settings/route.ts   # ユーザー設定
│       ├── ingredients/
│       │   ├── route.ts            # 一覧 GET / 作成 POST（同名同期限は数量統合）
│       │   ├── [id]/route.ts       # 取得・更新・削除
│       │   ├── analyze-receipt/route.ts  # SSE 2ステップ（OCR→食材抽出）
│       │   └── analyze-fridge/route.ts   # JSON単一ステップ（画像→食材）
│       ├── recipes/
│       │   ├── route.ts            # 一覧・作成
│       │   ├── [id]/route.ts       # 取得・更新（名前変更時は履歴も更新）・削除
│       │   ├── [id]/history/route.ts
│       │   └── ai-generate/route.ts  # SSE レスポンス（{ recipes: RecipeContent[] }）
│       ├── history/route.ts        # 料理履歴一覧・記録
│       └── stats/route.ts          # ダッシュボード用カウント
├── lib/
│   ├── api.ts                      # フロントエンド API クライアント
│   ├── db.ts                       # Neon `sql` タグ
│   ├── units.ts                    # 大さじ/小さじ → ml/g 換算
│   ├── compressImage.ts            # 画像圧縮ユーティリティ（Canvas, JPEG 85%, 1920px上限）
│   ├── context/
│   │   ├── AuthContext.tsx         # 認証状態（user / login / logout 等）
│   │   └── ThemeContext.tsx        # テーマ状態（localStorage 永続化）
│   └── hooks/
│       ├── useAsync.ts             # { data, loading, error } 汎用フック
│       ├── useAuth.ts
│       ├── useIngredients.ts
│       ├── useRecipes.ts
│       ├── useHistory.ts
│       ├── useStats.ts
│       └── useUser.ts
└── scripts/
    ├── migrate.ts                  # DB初期化（初回のみ実行）
    ├── check-tables.ts
    └── create-test-user.ts
```

---

## 5. データベース設計

### テーブル一覧

#### `users`
| カラム | 型 | 説明 |
|---|---|---|
| id | UUID PK | |
| name | TEXT | 表示名 |
| email | TEXT UNIQUE | |
| password | TEXT | SHA-256ハッシュ |
| created_at / updated_at | TIMESTAMPTZ | |

#### `user_settings`
| カラム | 型 | 説明 |
|---|---|---|
| id | UUID PK | |
| user_id | UUID UNIQUE FK | |
| warning_day | INTEGER | 期限警告の日数（デフォルト3） |
| notification_enabled | BOOLEAN | |
| theme | TEXT | `'light'` / `'dark'` / `'system'` |

#### `ingredients`
| カラム | 型 | 説明 |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| name | TEXT | 食材名 |
| quantity | NUMERIC | 数量（null可） |
| unit | TEXT | 単位（null可） |
| deadline | DATE | 賞味期限（null可） |
| source | TEXT | `'manual'` / `'receipt'` / `'fridge_photo'` |

#### `recipes`
| カラム | 型 | 説明 |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| name | TEXT | レシピ名 |
| content | JSONB | `RecipeContent` 型のJSON |

#### `recipe_histories`
| カラム | 型 | 説明 |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| recepi_id | UUID FK | **タイポあり**（正しくは `recipe_id`）変更不可 |
| name | TEXT | 調理時のレシピ名（レシピ名変更時は連動更新） |
| used_ingredients | JSONB | `UsedIngredient[]` 型のJSON |

#### `sessions`
| カラム | 型 |
|---|---|
| token | TEXT PK |
| user_id | UUID FK |

#### `password_reset_tokens`
| カラム | 型 |
|---|---|
| token | TEXT PK |
| user_id | UUID FK |
| expires_at | TIMESTAMPTZ |
| used_at | TIMESTAMPTZ（null可） |

---

## 6. 認証の仕組み

- **セッションベース認証**（JWT不使用）
- ログイン時にランダムトークンを `sessions` テーブルに保存
- `next-auth.session-token` という名前の **httpOnly Cookie** でトークンを保持
- 全 API ルートで `requireUser(request)` を呼ぶことで認証チェック
- パスワードは SHA-256 でハッシュ化（`hashPassword()` in `store.ts`）

```typescript
// 使い方（各ルートの先頭）
const auth = await requireUser(request);
if ("response" in auth) return auth.response;  // 401 を返す
const userId = auth.user.id;
```

---

## 7. API 一覧

### レスポンス形式

```typescript
// 成功
{ data: T }
// リスト
{ data: T[], pagination: { page, limit, total, totalPages } }
// エラー
{ error: { code: string, message: string } }
```

> `lib/api.ts` の `apiCall<T>()` は `{ data: T }` ラッパーを自動除去して `T` を返す。

### エンドポイント一覧

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/auth/signup` | 新規登録 |
| POST | `/api/auth/login` | ログイン |
| POST | `/api/auth/logout` | ログアウト |
| POST | `/api/auth/password-reset` | パスワードリセットメール送信 |
| PUT | `/api/auth/password` | パスワード変更 |
| GET/PUT/DELETE | `/api/me` | プロフィール取得・更新・削除 |
| GET/PUT | `/api/me/settings` | ユーザー設定 |
| GET | `/api/stats` | 食材数・レシピ数・期限間近数 |
| GET/POST | `/api/ingredients` | 食材一覧・作成（同名同期限は数量統合） |
| GET/PUT/DELETE | `/api/ingredients/[id]` | 食材操作 |
| POST | `/api/ingredients/analyze-receipt` | レシート画像→食材リスト（**SSE、2ステップ**） |
| POST | `/api/ingredients/analyze-fridge` | 冷蔵庫画像→食材リスト（JSON） |
| GET/POST | `/api/recipes` | レシピ一覧・作成 |
| GET/PUT/DELETE | `/api/recipes/[id]` | レシピ操作（名前変更時に履歴も更新） |
| GET | `/api/recipes/[id]/history` | レシピ別料理履歴 |
| POST | `/api/recipes/ai-generate` | AIレシピ生成（**SSE、`{ recipes: RecipeContent[] }`**） |
| GET/POST | `/api/history` | 料理履歴一覧・記録 |

---

## 8. フロントエンド設計

### 状態管理

グローバル状態は Context のみ使用（Redux等は不使用）。

| Context | 役割 |
|---|---|
| `AuthContext` | ユーザー情報・ログイン状態 |
| `ThemeContext` | テーマ設定（`localStorage` で永続化、`html.dark` クラスを制御） |

### カスタムフック

```typescript
const { list, item, error, methods } = useIngredients();
// list.data / list.loading / list.error
// methods.list() / methods.create() / methods.update() / methods.delete()
// methods.analyzeReceipt(file) → { rawText, ingredients }  ※SSEを内部でパース
// methods.analyzeFridge(file)  → { ingredients }
```

`useAsync<T>` が `{ data, loading, error }` を管理する基盤フック。

### 画像圧縮ユーティリティ (`lib/compressImage.ts`)

レシート・冷蔵庫撮影ページで共通使用。4MB 超の画像を Canvas + JPEG 85% / 1920px 上限で圧縮してからアップロード。サーバー側の受付上限は 5MB。

### テーマシステム

- `app/globals.css` に `:root`（ライト）と `html.dark`（ダーク）の CSS 変数を定義
- `ThemeContext` がページ読み込み時に `localStorage` を読んで即時適用
- 設定画面でクリックした瞬間に切り替わる（API保存は別途必要）

### 単位換算 (`lib/units.ts`)

「作った！」モーダルで、レシピの大さじ/小さじを在庫の ml/g に換算して消費量を計算:
- 大さじ1 = 15ml(g)
- 小さじ1 = 5ml(g)
- カップ1 = 200ml(g)

---

## 9. AIレシピ生成フロー

```
[RecipeForm] 食材選択 + 条件入力（人数・品数・strictモード）
    ↓
POST /api/recipes/ai-generate
  { ingredientIds, preferences, servings, dishCount, strictIngredients }
    ↓
サーバー側でプロンプトを構築
  strictNote（食材制約）+ dishNote（品数指示）+ preferenceText を合成
    ↓
Gemini gemini-2.5-flash に日本語プロンプト送信
    ↓
generateObject() で MultipleRecipesSchema 型に構造化
  → { recipes: RecipeContent[] }  ※品数が1のときも配列（要素数1）
    ↓
SSE (text/event-stream) で "data: {json}\n\n" を返す
    ↓
[lib/api.ts] ReadableStream を読んでパース → RecipeContent[]
    ↓
[RecipeForm] 品数分のカードを表示・個別に名前編集可能
    ↓
「N品すべてを保存」で各レシピを順次 POST /api/recipes → レシピ一覧へ遷移
```

**品数が2以上のとき**: 各カードに「メイン料理」「副菜1」…のバッジが付く。保存後はレシピ一覧（`/recipes`）へ遷移。

---

## 10. レシート撮影フロー（2ステップSSE）

```
[receipt/page.tsx] 画像選択（クリック or ドラッグ＆ドロップ）
    ↓
compressImage() で 4MB 超なら JPEG 85% / 1920px に圧縮
    ↓
POST /api/ingredients/analyze-receipt (multipart/form-data)
    ↓
【SSE Step 1】generateText() で画像からテキスト全文を OCR
  → SSE event: { type: "text", rawText: "..." }
    ↓
【SSE Step 2】generateObject() で rawText から食材を識別
  → SSE event: { type: "ingredients", ingredients: [...] }
    ↓
[receipt/page.tsx] 進捗インジケーター更新 → 食材リスト表示
  各食材はチェックボックス + 名前/数量/単位/期限を編集可能
  「読み取ったテキスト」アコーディオンで rawText を確認可能
    ↓
「N件の食材を追加」→ POST /api/ingredients (source: "receipt")
```

---

## 11. 冷蔵庫撮影フロー（単一ステップJSON）

```
[fridge/page.tsx] 画像選択
    ↓
compressImage() で圧縮
    ↓
POST /api/ingredients/analyze-fridge (multipart/form-data)
    ↓
generateObject() で画像から食材を直接識別
  confidence（確信度 0〜1）も返す
    ↓
[fridge/page.tsx] 食材リスト表示
  各食材に確信度バッジ（75%以上:緑 / 45-75%:橙 / 45%未満:赤）
    ↓
「N件の食材を追加」→ POST /api/ingredients (source: "fridge_photo")
```

---

## 12. 既知の問題・注意事項

### DBカラム名タイポ
`recipe_histories.recepi_id`（`recipe` が `recepi`）はマイグレーション済みのため変更不可。  
コード中では `recepi_id` のままで参照している。

### 日付のタイムゾーン
PostgreSQL の `DATE` 型を Neon ドライバーがローカル時刻の `Date` オブジェクトとして返す。  
`store.ts` の `rowToIngredient` では `toISOString()` を使わず `getFullYear()/getMonth()/getDate()` でローカル日付文字列を生成している（タイムゾーンズレ対策）。

### パスワードハッシュ
SHA-256（`crypto.createHash`）を使用。bcrypt等の計算コストのかかるアルゴリズムではないため、本番運用前に bcrypt への移行を検討。

### メール送信未実装
パスワードリセットのメール送信は実装されていない。API は用意されているがメール送信処理がない。

### Gemini 無料枠の制限
- RPM (1分あたりリクエスト): 5
- RPD (1日あたりリクエスト): 20
- レシート解析は1回で2RPMを消費する
- 本番運用では有料プランへの移行または代替プロバイダーの検討が必要

---

## 13. 開発時のよくある操作

```bash
# 開発サーバー
pnpm dev

# 型チェック
pnpm tsc --noEmit

# DBスキーマ確認
pnpm tsx scripts/check-tables.ts

# テストユーザー作成
pnpm tsx scripts/create-test-user.ts
```

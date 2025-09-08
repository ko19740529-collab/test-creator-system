# 塾向けテスト作成システム

## プロジェクト概要
- **名称**: 塾向けテスト作成システム
- **目標**: 塾講師がカスタマイズ可能な英単語テストを効率的に作成できるWebアプリケーション
- **技術スタック**: Hono + Cloudflare Pages + D1 Database + TypeScript + TailwindCSS

## 🌐 URLs
- **開発環境**: https://3000-iy9roslhge4a18rtrxtlu-6532622b.e2b.dev
- **API統計**: https://3000-iy9roslhge4a18rtrxtlu-6532622b.e2b.dev/api/categories/stats/overview
- **GitHub**: （GitHub設定後に追加予定）

## 📊 データアーキテクチャ

### データモデル
1. **categories** - カテゴリ管理
   - id, name, description, created_at
   
2. **words** - 英単語データ
   - id, english, japanese, category_id, difficulty (1-5), frequency, created_at, updated_at
   
3. **tests** - テスト情報
   - id, title, description, test_type, question_count, category_id, created_at
   
4. **test_items** - テスト問題
   - id, test_id, word_id, question_order, question_type, created_at
   
5. **test_history** - テスト使用履歴
   - id, test_id, used_at, notes

### ストレージサービス
- **Cloudflare D1**: SQLiteベースのグローバル分散データベース
- **ローカル開発**: `.wrangler/state/v3/d1` の自動生成SQLite

### データフロー
1. 単語データ管理 → カテゴリ別分類 → テスト作成
2. テスト設定 → 単語選択（範囲/個別/ランダム） → プレビュー → 実行

## 📚 ユーザーガイド

### 基本操作
1. **ダッシュボード**: 統計情報とクイックアクション
2. **単語管理**: 英単語の追加・編集・削除・検索
3. **テスト作成**: カスタマイズ可能なテスト生成

### テスト作成手順
1. テストタイトルとタイプを設定（英→日、日→英、混合）
2. カテゴリを選択（オプション）
3. 出題方法を選択：
   - **範囲選択**: ID範囲指定（例: 1-20）
   - **個別選択**: チェックボックスで単語選択
   - **ランダム選択**: 指定数をランダム出題
4. プレビューで確認後、テスト作成

### 現在の機能
✅ **完成済み機能**
- ダッシュボード（統計表示）
- 単語管理（一覧・検索・フィルター）
- カテゴリ管理
- テスト作成（3つの選択方法）
- プレビュー機能
- レスポンシブデザイン
- 7カテゴリ・70単語のサンプルデータ

### 次のアップデート予定
🔄 **実装中・予定機能**
- CSVインポート機能（ドラッグ&ドロップ）
- 単語追加・編集モーダル
- PDF生成機能（問題用・解答用）
- テスト表示・管理機能
- 単語の使用頻度分析
- テスト履歴管理

## 🚀 デプロイメント

### 現在のステータス
- **プラットフォーム**: 開発環境（E2B Sandbox）
- **ステータス**: ✅ アクティブ
- **最終更新**: 2025年9月8日

### 技術仕様
- **フロントエンド**: HTML5 + TailwindCSS + Vanilla JavaScript
- **バックエンド**: Hono Framework + TypeScript
- **データベース**: Cloudflare D1 (SQLite互換)
- **認証**: 今後実装予定
- **ファイルストレージ**: 静的ファイル（public/static/）

### 開発コマンド
```bash
# 開発環境起動
npm run dev:sandbox

# データベース操作
npm run db:migrate:local    # ローカルマイグレーション
npm run db:seed            # サンプルデータ投入
npm run db:reset           # データベースリセット

# ビルド・テスト
npm run build              # プロダクションビルド
npm run test               # 動作確認
```

### API エンドポイント

#### 統計・概要
- `GET /api/categories/stats/overview` - 全体統計

#### 単語管理
- `GET /api/words` - 単語一覧（検索・フィルター対応）
- `POST /api/words` - 単語追加
- `PUT /api/words/:id` - 単語更新
- `DELETE /api/words/:id` - 単語削除
- `POST /api/words/import` - CSVインポート

#### カテゴリ管理
- `GET /api/categories` - カテゴリ一覧
- `POST /api/categories` - カテゴリ追加

#### テスト管理
- `GET /api/tests` - テスト一覧
- `POST /api/tests` - テスト作成
- `POST /api/tests/preview` - テストプレビュー
- `GET /api/tests/:id` - テスト詳細
- `DELETE /api/tests/:id` - テスト削除

## 📈 使用状況
- **総単語数**: 70語
- **カテゴリ数**: 7カテゴリ
- **サンプルテスト**: 3件
- **対応レベル**: 基本〜TOEIC

## 🎯 推奨次ステップ
1. **CSVインポート機能の実装** - 大量データの一括登録
2. **PDF生成機能の追加** - プレミアム品質のテスト用紙作成
3. **GitHub連携の設定** - バージョン管理とバックアップ
4. **Cloudflare Pages本番デプロイ** - プロダクション環境構築
5. **ユーザー認証システム** - 複数ユーザー対応

---

**開発者ノート**: このシステムは段階的開発アプローチにより、第1段階の基本システム構築が完了しました。堅牢なデータベース設計とクリーンなAPI設計により、機能拡張が容易な構造となっています。
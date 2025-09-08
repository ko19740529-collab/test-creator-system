# 塾向けテスト作成システム

## プロジェクト概要
- **名称**: 塾向けテスト作成システム (Test Creator System)
- **目標**: 塾講師がカスタマイズ可能な英単語テストを効率的に作成・管理できるWebアプリケーション
- **技術スタック**: Hono + Cloudflare Pages + D1 Database + TypeScript + TailwindCSS

## 🌐 URLs
- **本番環境**: https://877772c2.test-creator-system.pages.dev
- **プロジェクトページ**: https://test-creator-system.pages.dev
- **開発環境**: https://3000-iy9roslhge4a18rtrxtlu-6532622b.e2b.dev
- **API統計**: https://877772c2.test-creator-system.pages.dev/api/categories/stats/overview
- **GitHub**: （GitHub設定後に追加予定）

## 📊 データアーキテクチャ

### データモデル
1. **categories** - カテゴリ管理 (7カテゴリ)
   - id, name, description, created_at
   
2. **words** - 英単語データ (70語)
   - id, english, japanese, category_id, difficulty (1-5), frequency, created_at, updated_at
   
3. **tests** - テスト情報 (3テンプレート)
   - id, title, description, test_type, question_count, category_id, created_at
   
4. **test_items** - テスト問題
   - id, test_id, word_id, question_order, question_type, created_at
   
5. **test_history** - テスト使用履歴
   - id, test_id, used_at, notes

### ストレージサービス
- **Cloudflare D1**: SQLiteベースのグローバル分散データベース
- **本番DB ID**: 97eec2ac-3230-4f16-a37b-74cbf5cc512d
- **ローカル開発**: `.wrangler/state/v3/d1` の自動生成SQLite

### データフロー
1. 単語データ管理 → カテゴリ別分類 → テスト作成 → PDF出力
2. CSV一括インポート → バリデーション → データベース登録
3. テスト設定 → 単語選択（範囲/個別/ランダム） → プレビュー → 実行・記録

## 🚀 完成機能 (第2段階完了)

### ✅ 基本機能
- **ダッシュボード**: 統計情報・クイックアクション
- **単語管理**: CRUD操作・検索・フィルター・一覧表示
- **カテゴリ管理**: 7種類の学習レベル別分類
- **テスト作成**: 3つの出題方法・3つのテストタイプ
- **プレビュー機能**: リアルタイム問題確認

### ✅ 高度機能（第2段階で追加）
- **CSVインポート機能**: 
  - ドラッグ&ドロップ対応
  - データバリデーション
  - 重複チェック
  - カテゴリ自動作成
  - エラーハンドリング

- **単語追加・編集モーダル**: 
  - フォームバリデーション
  - カテゴリ選択
  - 即座反映

- **高品質PDF生成機能**:
  - 問題用PDF・解答用PDF
  - カスタマイズ可能レイアウト
  - A4最適化
  - 日本語対応
  - jsPDF + HTML2Canvas

- **テスト詳細表示機能**:
  - 問題一覧表示
  - 使用履歴記録
  - テスト情報管理

### ✅ 技術的機能
- **レスポンシブデザイン**: PC・タブレット・スマホ対応
- **リアルタイム検索**: 英語・日本語・カテゴリ・難易度フィルター
- **バッチ操作**: 複数選択・一括削除
- **エラーハンドリング**: ユーザーフレンドリーなエラー表示
- **データ永続化**: Cloudflare D1による高可用性

## 📚 ユーザーガイド

### 基本操作
1. **ダッシュボード**: システム概要と統計情報を確認
2. **単語管理**: 英単語の追加・編集・削除・検索
3. **テスト作成**: カスタマイズ可能なテスト生成・PDF出力

### CSVインポート手順
1. CSVファイル形式: `english,japanese,category,difficulty`
2. ドラッグ&ドロップまたはファイル選択
3. プレビュー確認
4. インポート実行（重複チェック・エラー処理自動）

### テスト作成手順
1. テストタイトルとタイプを設定（英→日、日→英、混合）
2. カテゴリを選択（オプション）
3. 出題方法を選択：
   - **範囲選択**: ID範囲指定（例: 1-20）
   - **個別選択**: チェックボックスで単語選択
   - **ランダム選択**: 指定数をランダム出題
4. プレビューで確認
5. テスト作成・PDF生成

### PDF生成オプション
- **問題用PDF**: 解答欄付きテスト用紙
- **解答用PDF**: 解答付き採点用
- **レイアウト設定**: 問題数/ページ、フォントサイズ調整
- **高品質出力**: A4サイズ最適化、日本語対応

## 🛠️ 技術仕様

### アーキテクチャ
- **フロントエンド**: HTML5 + TailwindCSS + Vanilla JavaScript
- **バックエンド**: Hono Framework + TypeScript
- **データベース**: Cloudflare D1 (SQLite互換)
- **デプロイメント**: Cloudflare Pages
- **PDF生成**: jsPDF + HTML2Canvas
- **認証**: 今後実装予定

### 開発・デプロイ環境
- **開発**: E2B Sandbox + PM2
- **本番**: Cloudflare Pages (https://877772c2.test-creator-system.pages.dev)
- **データベース**: グローバル分散 D1 Database
- **CDN**: Cloudflare Edge Network

### API エンドポイント

#### 統計・概要
- `GET /api/categories/stats/overview` - 全体統計

#### 単語管理
- `GET /api/words` - 単語一覧（検索・フィルター対応）
- `POST /api/words` - 単語追加
- `PUT /api/words/:id` - 単語更新
- `DELETE /api/words/:id` - 単語削除
- `POST /api/words/import` - CSVインポート（バリデーション付き）

#### カテゴリ管理
- `GET /api/categories` - カテゴリ一覧
- `POST /api/categories` - カテゴリ追加

#### テスト管理
- `GET /api/tests` - テスト一覧
- `POST /api/tests` - テスト作成
- `POST /api/tests/preview` - テストプレビュー
- `GET /api/tests/:id` - テスト詳細
- `DELETE /api/tests/:id` - テスト削除
- `POST /api/tests/:id/history` - 使用履歴記録

### 開発コマンド
```bash
# 本番環境
npm run deploy              # Cloudflare Pagesにデプロイ
npm run build              # プロダクションビルド

# 開発環境
npm run dev:sandbox        # サンドボックス開発サーバー
npm run test               # 動作確認

# データベース操作
npm run db:migrate:local   # ローカルマイグレーション
npm run db:migrate:prod    # 本番マイグレーション
npm run db:seed            # サンプルデータ投入
npm run db:reset           # データベースリセット
```

## 📈 現在の状況
- **総単語数**: 70語（7カテゴリ）
- **サンプルテスト**: 3件
- **対応レベル**: 基本〜TOEIC
- **デプロイ状況**: ✅ 本番稼働中
- **パフォーマンス**: エッジ配信・高速レスポンス

## 🎯 次期開発予定

### Phase 3: ユーザー体験向上
- **ユーザー認証システム**: 複数ユーザー対応
- **データ分析機能**: 学習進捗・弱点分析
- **テンプレート機能**: 再利用可能なテスト設定
- **通知システム**: 操作結果・エラー通知改善

### Phase 4: 機能拡張
- **他科目対応**: 数学・理科・社会の問題作成
- **問題形式拡張**: 四択・並び替え・記述問題
- **スケジュール機能**: 定期テスト・宿題管理
- **クラス管理**: 生徒情報・成績管理

### GitHub連携
**注意**: GitHub連携は手動設定が必要です：
1. ブラウザでGitHubタブを開く
2. GitHub認証を完了
3. リポジトリを選択・作成
4. 開発環境で `setup_github_environment` を実行
5. リポジトリにプッシュ

---

**開発者ノート**: このシステムは段階的開発アプローチにより、第2段階が完了しました。高度な機能が実装され、プロダクション環境で安定稼働中です。堅牢な設計により、機能拡張が容易な構造となっています。
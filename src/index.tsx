import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { CloudflareBindings } from './types/database'

// Import API routes
import wordsAPI from './routes/words'
import categoriesAPI from './routes/categories'
import testsAPI from './routes/tests'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API routes
app.route('/api/words', wordsAPI)
app.route('/api/categories', categoriesAPI)  
app.route('/api/tests', testsAPI)

// Main application page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>塾向けテスト作成システム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#1e40af',
                  secondary: '#3b82f6',
                  accent: '#60a5fa'
                }
              }
            }
          }
        </script>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 flex items-center">
                            <i class="fas fa-graduation-cap text-2xl text-primary mr-3"></i>
                            <h1 class="text-xl font-bold text-gray-900">テスト作成システム</h1>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button onclick="showSection('dashboard')" class="nav-btn active" id="nav-dashboard">
                            <i class="fas fa-tachometer-alt mr-2"></i>ダッシュボード
                        </button>
                        <button onclick="showSection('words')" class="nav-btn" id="nav-words">
                            <i class="fas fa-book mr-2"></i>単語管理
                        </button>
                        <button onclick="showSection('tests')" class="nav-btn" id="nav-tests">
                            <i class="fas fa-file-alt mr-2"></i>テスト作成
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <!-- Dashboard Section -->
            <div id="dashboard-section" class="section active">
                <div class="mb-8">
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">ダッシュボード</h2>
                    <p class="text-gray-600">テスト作成システムへようこそ</p>
                </div>

                <!-- Statistics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-book text-2xl text-blue-500"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">総単語数</p>
                                <p class="text-2xl font-semibold text-gray-900" id="total-words">-</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-file-alt text-2xl text-green-500"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">作成済みテスト</p>
                                <p class="text-2xl font-semibold text-gray-900" id="total-tests">-</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-tags text-2xl text-purple-500"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">カテゴリ数</p>
                                <p class="text-2xl font-semibold text-gray-900" id="total-categories">-</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">クイックアクション</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onclick="showSection('words')" class="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                            <i class="fas fa-plus text-2xl text-blue-600 mb-2"></i>
                            <span class="text-sm font-medium text-blue-900">単語を追加</span>
                        </button>
                        <button onclick="showImportModal()" class="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                            <i class="fas fa-file-upload text-2xl text-green-600 mb-2"></i>
                            <span class="text-sm font-medium text-green-900">CSVインポート</span>
                        </button>
                        <button onclick="showSection('tests')" class="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                            <i class="fas fa-file-alt text-2xl text-purple-600 mb-2"></i>
                            <span class="text-sm font-medium text-purple-900">テスト作成</span>
                        </button>
                        <button onclick="loadRecentTests()" class="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                            <i class="fas fa-history text-2xl text-orange-600 mb-2"></i>
                            <span class="text-sm font-medium text-orange-900">テスト履歴</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Words Management Section -->
            <div id="words-section" class="section">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-3xl font-bold text-gray-900">単語管理</h2>
                        <p class="text-gray-600">英単語の追加、編集、削除</p>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="showImportModal()" class="btn-secondary">
                            <i class="fas fa-file-upload mr-2"></i>CSVインポート
                        </button>
                        <button onclick="showAddWordModal()" class="btn-primary">
                            <i class="fas fa-plus mr-2"></i>単語追加
                        </button>
                    </div>
                </div>

                <!-- Search and Filter -->
                <div class="bg-white rounded-lg shadow p-6 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">検索</label>
                            <input type="text" id="word-search" placeholder="英語または日本語で検索" class="input-field">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                            <select id="category-filter" class="input-field">
                                <option value="">全てのカテゴリ</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">難易度</label>
                            <select id="difficulty-filter" class="input-field">
                                <option value="">全ての難易度</option>
                                <option value="1">1 (易)</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5 (難)</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-4 flex space-x-3">
                        <button onclick="searchWords()" class="btn-primary">
                            <i class="fas fa-search mr-2"></i>検索
                        </button>
                        <button onclick="resetWordSearch()" class="btn-secondary">
                            <i class="fas fa-undo mr-2"></i>リセット
                        </button>
                    </div>
                </div>

                <!-- Words Table -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">単語一覧</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <input type="checkbox" id="select-all-words" onchange="toggleAllWordsSelection()">
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">英語</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日本語</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">カテゴリ</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">難易度</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody id="words-table-body" class="bg-white divide-y divide-gray-200">
                                <!-- Words will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                    <div class="px-6 py-3 bg-gray-50 border-t">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-700" id="words-count">0 件の単語</span>
                            <div class="flex space-x-2">
                                <button onclick="deleteSelectedWords()" class="btn-danger" id="delete-selected-btn" style="display: none;">
                                    <i class="fas fa-trash mr-2"></i>選択項目を削除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Test Creation Section -->
            <div id="tests-section" class="section">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-3xl font-bold text-gray-900">テスト作成</h2>
                        <p class="text-gray-600">カスタマイズ可能な単語テストを作成</p>
                    </div>
                    <button onclick="showCreateTestModal()" class="btn-primary">
                        <i class="fas fa-plus mr-2"></i>新規テスト
                    </button>
                </div>

                <!-- Test Creation Form -->
                <div class="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">テスト設定</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">テストタイトル</label>
                            <input type="text" id="test-title" placeholder="例: 英検2級 第1回" class="input-field">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">テストタイプ</label>
                            <select id="test-type" class="input-field">
                                <option value="english_to_japanese">英語 → 日本語</option>
                                <option value="japanese_to_english">日本語 → 英語</option>
                                <option value="mixed">混合</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                            <select id="test-category" class="input-field">
                                <option value="">全てのカテゴリ</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">出題方法</label>
                            <select id="selection-type" class="input-field" onchange="toggleSelectionMethod()">
                                <option value="range">範囲選択 (ID指定)</option>
                                <option value="individual">個別選択</option>
                                <option value="random">ランダム選択</option>
                            </select>
                        </div>
                    </div>

                    <!-- Range Selection -->
                    <div id="range-selection" class="mt-6">
                        <h4 class="text-md font-medium text-gray-900 mb-3">範囲選択</h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">開始ID</label>
                                <input type="number" id="start-id" min="1" placeholder="1" class="input-field">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">終了ID</label>
                                <input type="number" id="end-id" min="1" placeholder="10" class="input-field">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">問題数</label>
                                <input type="number" id="question-count" min="1" max="100" placeholder="10" class="input-field">
                            </div>
                        </div>
                    </div>

                    <!-- Individual Selection -->
                    <div id="individual-selection" class="mt-6" style="display: none;">
                        <h4 class="text-md font-medium text-gray-900 mb-3">個別選択</h4>
                        <div class="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                            <div id="word-selection-list">
                                <!-- Word selection checkboxes will be loaded here -->
                            </div>
                        </div>
                    </div>

                    <!-- Random Selection -->
                    <div id="random-selection" class="mt-6" style="display: none;">
                        <h4 class="text-md font-medium text-gray-900 mb-3">ランダム選択</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">問題数</label>
                                <input type="number" id="random-count" min="1" max="100" placeholder="20" class="input-field">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">難易度重み付け</label>
                                <select id="difficulty-weight" class="input-field">
                                    <option value="equal">均等</option>
                                    <option value="easy">易しめ重視</option>
                                    <option value="hard">難しめ重視</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 flex items-center">
                        <input type="checkbox" id="randomize-order" class="mr-2">
                        <label for="randomize-order" class="text-sm text-gray-700">出題順序をランダムにする</label>
                    </div>

                    <div class="mt-6 flex space-x-3">
                        <button onclick="previewTest()" class="btn-secondary">
                            <i class="fas fa-eye mr-2"></i>プレビュー
                        </button>
                        <button onclick="createTest()" class="btn-primary">
                            <i class="fas fa-plus mr-2"></i>テスト作成
                        </button>
                    </div>
                </div>

                <!-- Test List -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">作成済みテスト</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タイトル</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タイプ</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">問題数</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作成日</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody id="tests-table-body" class="bg-white divide-y divide-gray-200">
                                <!-- Tests will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>

        <!-- Modals will be added here -->
        <div id="modal-container"></div>

        <!-- Loading Spinner -->
        <div id="loading" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" style="display: none;">
            <div class="bg-white p-6 rounded-lg shadow-lg">
                <div class="flex items-center">
                    <i class="fas fa-spinner fa-spin text-2xl text-blue-500 mr-4"></i>
                    <span class="text-lg">処理中...</span>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
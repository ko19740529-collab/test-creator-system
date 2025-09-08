// Test Creation System - Frontend JavaScript

// Global state
let currentWords = [];
let currentCategories = [];
let currentTests = [];
let selectedWordIds = new Set();

// API client
const api = {
  async get(url) {
    const response = await axios.get(`/api${url}`);
    return response.data;
  },
  
  async post(url, data) {
    const response = await axios.post(`/api${url}`, data);
    return response.data;
  },
  
  async put(url, data) {
    const response = await axios.put(`/api${url}`, data);
    return response.data;
  },
  
  async delete(url) {
    const response = await axios.delete(`/api${url}`);
    return response.data;
  }
};

// Utility functions
function showLoading() {
  document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type} fade-in`;
  notification.innerHTML = `
    <div class="flex items-center justify-between">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-sm">×</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.remove('fade-in');
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 200);
  }, 3000);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ja-JP');
}

// Navigation
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Remove active class from all nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected section
  document.getElementById(`${sectionName}-section`).classList.add('active');
  document.getElementById(`nav-${sectionName}`).classList.add('active');
  
  // Load data for the section
  switch(sectionName) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'words':
      loadWords();
      break;
    case 'tests':
      loadTests();
      break;
  }
}

// Dashboard functions
async function loadDashboard() {
  try {
    showLoading();
    const stats = await api.get('/categories/stats/overview');
    
    if (stats.success) {
      document.getElementById('total-words').textContent = stats.data.words;
      document.getElementById('total-tests').textContent = stats.data.tests;
      document.getElementById('total-categories').textContent = stats.data.categories;
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showNotification('ダッシュボードの読み込みに失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

// Words functions
async function loadWords() {
  try {
    showLoading();
    const [wordsResult, categoriesResult] = await Promise.all([
      api.get('/words'),
      api.get('/categories')
    ]);
    
    if (wordsResult.success) {
      currentWords = wordsResult.data.words;
      renderWordsTable();
    }
    
    if (categoriesResult.success) {
      currentCategories = categoriesResult.data;
      populateCategorySelects();
    }
  } catch (error) {
    console.error('Error loading words:', error);
    showNotification('単語の読み込みに失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

function renderWordsTable() {
  const tbody = document.getElementById('words-table-body');
  tbody.innerHTML = '';
  
  if (currentWords.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-4 text-center text-gray-500">
          単語が見つかりません
        </td>
      </tr>
    `;
    return;
  }
  
  currentWords.forEach(word => {
    const row = document.createElement('tr');
    row.className = 'table-row';
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <input type="checkbox" value="${word.id}" onchange="toggleWordSelection(${word.id})">
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${word.id}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${word.english}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${word.japanese}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${word.category_name || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          ${word.difficulty}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onclick="editWord(${word.id})" class="text-indigo-600 hover:text-indigo-900 mr-2">編集</button>
        <button onclick="deleteWord(${word.id})" class="text-red-600 hover:text-red-900">削除</button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  document.getElementById('words-count').textContent = `${currentWords.length} 件の単語`;
}

function populateCategorySelects() {
  const selects = ['category-filter', 'test-category'];
  
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Keep existing options and add new ones
    const existingOptions = select.innerHTML;
    let newOptions = '';
    
    currentCategories.forEach(category => {
      newOptions += `<option value="${category.id}">${category.name}</option>`;
    });
    
    select.innerHTML = existingOptions + newOptions;
  });
}

function toggleWordSelection(wordId) {
  if (selectedWordIds.has(wordId)) {
    selectedWordIds.delete(wordId);
  } else {
    selectedWordIds.add(wordId);
  }
  
  updateSelectionUI();
}

function toggleAllWordsSelection() {
  const checkbox = document.getElementById('select-all-words');
  const wordCheckboxes = document.querySelectorAll('#words-table-body input[type="checkbox"]');
  
  wordCheckboxes.forEach(cb => {
    cb.checked = checkbox.checked;
    const wordId = parseInt(cb.value);
    
    if (checkbox.checked) {
      selectedWordIds.add(wordId);
    } else {
      selectedWordIds.delete(wordId);
    }
  });
  
  updateSelectionUI();
}

function updateSelectionUI() {
  const deleteBtn = document.getElementById('delete-selected-btn');
  const selectAllCheckbox = document.getElementById('select-all-words');
  
  if (selectedWordIds.size > 0) {
    deleteBtn.style.display = 'inline-flex';
    deleteBtn.textContent = `選択項目を削除 (${selectedWordIds.size})`;
  } else {
    deleteBtn.style.display = 'none';
  }
  
  // Update select all checkbox state
  const totalWords = currentWords.length;
  const selectedCount = selectedWordIds.size;
  
  if (selectedCount === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (selectedCount === totalWords) {
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  }
}

async function searchWords() {
  const search = document.getElementById('word-search').value;
  const categoryId = document.getElementById('category-filter').value;
  const difficulty = document.getElementById('difficulty-filter').value;
  
  try {
    showLoading();
    const params = new URLSearchParams();
    
    if (search) params.append('search', search);
    if (categoryId) params.append('category_id', categoryId);
    if (difficulty) params.append('difficulty', difficulty);
    
    const result = await api.get(`/words?${params.toString()}`);
    
    if (result.success) {
      currentWords = result.data.words;
      renderWordsTable();
      selectedWordIds.clear();
      updateSelectionUI();
    }
  } catch (error) {
    console.error('Error searching words:', error);
    showNotification('検索に失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

function resetWordSearch() {
  document.getElementById('word-search').value = '';
  document.getElementById('category-filter').value = '';
  document.getElementById('difficulty-filter').value = '';
  loadWords();
}

async function deleteSelectedWords() {
  if (selectedWordIds.size === 0) return;
  
  if (!confirm(`選択した ${selectedWordIds.size} 件の単語を削除しますか？`)) return;
  
  try {
    showLoading();
    const result = await api.delete('/words', { ids: Array.from(selectedWordIds) });
    
    if (result.success) {
      showNotification(result.message, 'success');
      selectedWordIds.clear();
      loadWords();
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('Error deleting words:', error);
    showNotification('削除に失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

async function deleteWord(wordId) {
  if (!confirm('この単語を削除しますか？')) return;
  
  try {
    showLoading();
    const result = await api.delete(`/words/${wordId}`);
    
    if (result.success) {
      showNotification(result.message, 'success');
      loadWords();
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('Error deleting word:', error);
    showNotification('削除に失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

// Test functions
async function loadTests() {
  try {
    showLoading();
    const result = await api.get('/tests');
    
    if (result.success) {
      currentTests = result.data.tests;
      renderTestsTable();
    }
    
    // Also load categories for test creation
    if (currentCategories.length === 0) {
      const categoriesResult = await api.get('/categories');
      if (categoriesResult.success) {
        currentCategories = categoriesResult.data;
        populateCategorySelects();
      }
    }
  } catch (error) {
    console.error('Error loading tests:', error);
    showNotification('テストの読み込みに失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

function renderTestsTable() {
  const tbody = document.getElementById('tests-table-body');
  tbody.innerHTML = '';
  
  if (currentTests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-4 text-center text-gray-500">
          テストが見つかりません
        </td>
      </tr>
    `;
    return;
  }
  
  currentTests.forEach(test => {
    const row = document.createElement('tr');
    row.className = 'table-row';
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${test.id}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${test.title}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${getTestTypeLabel(test.test_type)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${test.question_count}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(test.created_at)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onclick="viewTest(${test.id})" class="text-blue-600 hover:text-blue-900 mr-2">表示</button>
        <button onclick="downloadTest(${test.id})" class="text-green-600 hover:text-green-900 mr-2">PDF</button>
        <button onclick="deleteTest(${test.id})" class="text-red-600 hover:text-red-900">削除</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function getTestTypeLabel(type) {
  const labels = {
    'english_to_japanese': '英語→日本語',
    'japanese_to_english': '日本語→英語',
    'mixed': '混合'
  };
  return labels[type] || type;
}

function toggleSelectionMethod() {
  const selectionType = document.getElementById('selection-type').value;
  const rangeDiv = document.getElementById('range-selection');
  const individualDiv = document.getElementById('individual-selection');
  const randomDiv = document.getElementById('random-selection');
  
  // Hide all selection methods
  rangeDiv.style.display = 'none';
  individualDiv.style.display = 'none';
  randomDiv.style.display = 'none';
  
  // Show selected method
  switch(selectionType) {
    case 'range':
      rangeDiv.style.display = 'block';
      break;
    case 'individual':
      individualDiv.style.display = 'block';
      loadWordSelectionList();
      break;
    case 'random':
      randomDiv.style.display = 'block';
      break;
  }
}

async function loadWordSelectionList() {
  const categoryId = document.getElementById('test-category').value;
  
  try {
    const params = categoryId ? `?category_id=${categoryId}&limit=100` : '?limit=100';
    const result = await api.get(`/words${params}`);
    
    if (result.success) {
      const container = document.getElementById('word-selection-list');
      container.innerHTML = '';
      
      result.data.words.forEach(word => {
        const div = document.createElement('div');
        div.className = 'word-item';
        div.innerHTML = `
          <input type="checkbox" id="word-${word.id}" value="${word.id}">
          <label for="word-${word.id}" class="flex-1">
            <span class="font-medium">${word.english}</span> - ${word.japanese}
            <span class="text-gray-500 text-sm ml-2">(ID: ${word.id})</span>
          </label>
        `;
        container.appendChild(div);
      });
    }
  } catch (error) {
    console.error('Error loading word selection list:', error);
    showNotification('単語リストの読み込みに失敗しました', 'error');
  }
}

async function previewTest() {
  const testData = getTestFormData();
  
  if (!testData) return;
  
  try {
    showLoading();
    const result = await api.post('/tests/preview', testData);
    
    if (result.success) {
      showTestPreviewModal(result.data);
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('Error previewing test:', error);
    showNotification('プレビューの生成に失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

async function createTest() {
  const testData = getTestFormData();
  
  if (!testData) return;
  
  try {
    showLoading();
    const result = await api.post('/tests', testData);
    
    if (result.success) {
      showNotification(result.message, 'success');
      clearTestForm();
      loadTests();
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('Error creating test:', error);
    showNotification('テストの作成に失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

function getTestFormData() {
  const title = document.getElementById('test-title').value.trim();
  const testType = document.getElementById('test-type').value;
  const categoryId = document.getElementById('test-category').value;
  const selectionType = document.getElementById('selection-type').value;
  const randomizeOrder = document.getElementById('randomize-order').checked;
  
  if (!title) {
    showNotification('テストタイトルを入力してください', 'warning');
    return null;
  }
  
  const testData = {
    title,
    test_type: testType,
    category_id: categoryId || null,
    randomize_order: randomizeOrder,
    word_selection: {
      type: selectionType
    }
  };
  
  if (selectionType === 'range') {
    const startId = parseInt(document.getElementById('start-id').value);
    const endId = parseInt(document.getElementById('end-id').value);
    
    if (!startId || !endId) {
      showNotification('開始IDと終了IDを入力してください', 'warning');
      return null;
    }
    
    if (startId > endId) {
      showNotification('開始IDは終了ID以下である必要があります', 'warning');
      return null;
    }
    
    testData.word_selection.start_id = startId;
    testData.word_selection.end_id = endId;
  } else if (selectionType === 'individual') {
    const checkedBoxes = document.querySelectorAll('#word-selection-list input:checked');
    const wordIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
    
    if (wordIds.length === 0) {
      showNotification('単語を選択してください', 'warning');
      return null;
    }
    
    testData.word_selection.word_ids = wordIds;
  } else if (selectionType === 'random') {
    const count = parseInt(document.getElementById('random-count').value);
    
    if (!count || count < 1) {
      showNotification('問題数を入力してください', 'warning');
      return null;
    }
    
    testData.word_selection.count = count;
  }
  
  return testData;
}

function clearTestForm() {
  document.getElementById('test-title').value = '';
  document.getElementById('test-type').value = 'english_to_japanese';
  document.getElementById('test-category').value = '';
  document.getElementById('selection-type').value = 'range';
  document.getElementById('start-id').value = '';
  document.getElementById('end-id').value = '';
  document.getElementById('random-count').value = '';
  document.getElementById('randomize-order').checked = false;
  
  toggleSelectionMethod();
}

function showTestPreviewModal(previewData) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content max-w-4xl">
      <div class="modal-header">
        <h3 class="text-lg font-medium">テストプレビュー</h3>
      </div>
      <div class="modal-body max-h-96 overflow-y-auto">
        <p class="mb-4 text-gray-600">総問題数: ${previewData.total_questions}</p>
        <div class="space-y-3">
          ${previewData.items.map(item => `
            <div class="preview-question ${item.question_type}">
              <div class="flex items-center justify-between">
                <span class="font-medium">問題 ${item.question_order}</span>
                <span class="text-sm text-gray-500">${getTestTypeLabel(item.question_type)}</span>
              </div>
              <div class="mt-2">
                ${item.question_type === 'english_to_japanese' ? 
                  `<p><strong>${item.word.english}</strong></p><p class="text-gray-600">答え: ${item.word.japanese}</p>` :
                  `<p><strong>${item.word.japanese}</strong></p><p class="text-gray-600">答え: ${item.word.english}</p>`
                }
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="this.closest('.modal').remove()" class="btn-secondary">閉じる</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function deleteTest(testId) {
  if (!confirm('このテストを削除しますか？')) return;
  
  try {
    showLoading();
    const result = await api.delete(`/tests/${testId}`);
    
    if (result.success) {
      showNotification(result.message, 'success');
      loadTests();
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('Error deleting test:', error);
    showNotification('削除に失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

// Modal functions
function showAddWordModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="text-lg font-medium">単語追加</h3>
      </div>
      <form id="add-word-form" class="modal-body space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">英語 *</label>
          <input type="text" id="word-english" required class="input-field" placeholder="例: apple">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">日本語 *</label>
          <input type="text" id="word-japanese" required class="input-field" placeholder="例: りんご">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
          <select id="word-category" class="input-field">
            <option value="1">基本単語</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">難易度</label>
          <select id="word-difficulty" class="input-field">
            <option value="1">1 (易)</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5 (難)</option>
          </select>
        </div>
      </form>
      <div class="modal-footer">
        <button onclick="this.closest('.modal').remove()" class="btn-secondary">キャンセル</button>
        <button onclick="submitAddWord()" class="btn-primary">追加</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Populate categories
  populateModalCategories('word-category');
}

function showImportModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content max-w-2xl">
      <div class="modal-header">
        <h3 class="text-lg font-medium">CSVファイルインポート</h3>
      </div>
      <div class="modal-body">
        <div class="mb-6">
          <h4 class="font-medium text-gray-900 mb-2">CSVファイル形式</h4>
          <p class="text-sm text-gray-600 mb-3">以下の形式でCSVファイルを作成してください：</p>
          <div class="bg-gray-50 p-3 rounded border text-sm font-mono">
            english,japanese,category,difficulty<br>
            apple,りんご,基本単語,1<br>
            beautiful,美しい,中学英語,2
          </div>
          <ul class="text-sm text-gray-600 mt-2 list-disc list-inside">
            <li>1行目はヘッダー行です</li>
            <li>category は省略可能（デフォルト: 基本単語）</li>
            <li>difficulty は 1-5 の数字（省略可能、デフォルト: 1）</li>
          </ul>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">ファイル選択</label>
          <div id="csv-drop-zone" class="drop-zone">
            <div class="text-center">
              <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-3"></i>
              <p class="text-gray-600">CSVファイルをドラッグ&ドロップするか、クリックして選択</p>
              <input type="file" id="csv-file-input" accept=".csv" class="hidden">
              <button type="button" onclick="document.getElementById('csv-file-input').click()" class="mt-2 btn-secondary">
                ファイル選択
              </button>
            </div>
          </div>
        </div>
        
        <div id="csv-preview" class="hidden mb-4">
          <h4 class="font-medium text-gray-900 mb-2">プレビュー</h4>
          <div class="bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto">
            <div id="csv-preview-content"></div>
          </div>
        </div>
        
        <div id="import-options" class="hidden">
          <div class="flex items-center mb-3">
            <input type="checkbox" id="skip-duplicates" checked class="mr-2">
            <label for="skip-duplicates" class="text-sm text-gray-700">重複する単語をスキップ</label>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="create-categories" checked class="mr-2">
            <label for="create-categories" class="text-sm text-gray-700">存在しないカテゴリを自動作成</label>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="this.closest('.modal').remove()" class="btn-secondary">キャンセル</button>
        <button id="import-btn" onclick="executeImport()" class="btn-primary" disabled>インポート</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  setupCSVDropZone();
}

function showCreateTestModal() {
  // Implementation for create test modal
  showNotification('専用テスト作成機能は次のアップデートで実装予定です', 'info');
}

async function editWord(wordId) {
  try {
    showLoading();
    const result = await api.get(`/words/${wordId}`);
    
    if (result.success) {
      showEditWordModal(result.data);
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('Error loading word for edit:', error);
    showNotification('単語情報の取得に失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

function showEditWordModal(word) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="text-lg font-medium">単語編集</h3>
      </div>
      <form id="edit-word-form" class="modal-body space-y-4">
        <input type="hidden" id="edit-word-id" value="${word.id}">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">英語 *</label>
          <input type="text" id="edit-word-english" required class="input-field" value="${word.english}">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">日本語 *</label>
          <input type="text" id="edit-word-japanese" required class="input-field" value="${word.japanese}">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
          <select id="edit-word-category" class="input-field">
            <option value="1">基本単語</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">難易度</label>
          <select id="edit-word-difficulty" class="input-field">
            <option value="1">1 (易)</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5 (難)</option>
          </select>
        </div>
        <div class="bg-gray-50 p-3 rounded">
          <div class="text-sm text-gray-600">
            <p><strong>作成日:</strong> ${formatDate(word.created_at)}</p>
            <p><strong>更新日:</strong> ${formatDate(word.updated_at)}</p>
            <p><strong>使用頻度:</strong> ${word.frequency}回</p>
          </div>
        </div>
      </form>
      <div class="modal-footer">
        <button onclick="this.closest('.modal').remove()" class="btn-secondary">キャンセル</button>
        <button onclick="submitEditWord()" class="btn-primary">更新</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Populate and select current category
  populateModalCategories('edit-word-category');
  document.getElementById('edit-word-category').value = word.category_id;
  document.getElementById('edit-word-difficulty').value = word.difficulty;
}

async function submitEditWord() {
  const wordId = document.getElementById('edit-word-id').value;
  const english = document.getElementById('edit-word-english').value.trim();
  const japanese = document.getElementById('edit-word-japanese').value.trim();
  const categoryId = document.getElementById('edit-word-category').value;
  const difficulty = document.getElementById('edit-word-difficulty').value;
  
  if (!english || !japanese) {
    showNotification('英語と日本語を入力してください', 'warning');
    return;
  }
  
  try {
    showLoading();
    const result = await api.put(`/words/${wordId}`, {
      english,
      japanese,
      category_id: parseInt(categoryId),
      difficulty: parseInt(difficulty)
    });
    
    if (result.success) {
      showNotification(result.message, 'success');
      document.querySelector('.modal').remove();
      loadWords(); // Refresh the words list
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('Edit word error:', error);
    showNotification('単語の更新に失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

async function viewTest(testId) {
  try {
    showLoading();
    const result = await api.get(`/tests/${testId}`);
    
    if (result.success) {
      const { test, items } = result.data;
      showTestDetailModal(test, items);
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('Error loading test details:', error);
    showNotification('テスト詳細の取得に失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

function showTestDetailModal(test, items) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content max-w-4xl">
      <div class="modal-header">
        <h3 class="text-lg font-medium">テスト詳細</h3>
      </div>
      <div class="modal-body">
        <!-- Test Information -->
        <div class="mb-6 bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium text-gray-900 mb-3">テスト情報</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><strong>タイトル:</strong> ${test.title}</div>
            <div><strong>問題数:</strong> ${test.question_count}問</div>
            <div><strong>タイプ:</strong> ${getTestTypeLabel(test.test_type)}</div>
            <div><strong>カテゴリ:</strong> ${test.category_name || '全て'}</div>
            <div><strong>作成日:</strong> ${formatDate(test.created_at)}</div>
            <div><strong>テストID:</strong> ${test.id}</div>
          </div>
        </div>
        
        <!-- Questions List -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-medium text-gray-900">問題一覧</h4>
            <div class="flex space-x-2">
              <button onclick="downloadTest(${test.id})" class="btn-secondary text-sm">
                <i class="fas fa-file-pdf mr-1"></i>PDF出力
              </button>
              <button onclick="recordTestUsage(${test.id})" class="btn-primary text-sm">
                <i class="fas fa-check mr-1"></i>使用記録
              </button>
            </div>
          </div>
          
          <div class="max-h-96 overflow-y-auto border rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">問題番号</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">問題</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">解答</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">タイプ</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${items.map(item => `
                  <tr>
                    <td class="px-4 py-2 text-sm font-medium text-gray-900">${item.question_order}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">
                      ${item.question_type === 'english_to_japanese' ? item.english : item.japanese}
                    </td>
                    <td class="px-4 py-2 text-sm text-gray-600">
                      ${item.question_type === 'english_to_japanese' ? item.japanese : item.english}
                    </td>
                    <td class="px-4 py-2 text-xs">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.question_type === 'english_to_japanese' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }">
                        ${getTestTypeLabel(item.question_type)}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        ${test.description ? `
          <div class="mb-4">
            <h4 class="font-medium text-gray-900 mb-2">説明</h4>
            <p class="text-sm text-gray-600 bg-gray-50 p-3 rounded">${test.description}</p>
          </div>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button onclick="this.closest('.modal').remove()" class="btn-secondary">閉じる</button>
        <button onclick="duplicateTest(${test.id})" class="btn-primary">
          <i class="fas fa-copy mr-2"></i>テスト複製
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function recordTestUsage(testId) {
  const notes = prompt('使用記録のメモ（任意）:');
  
  try {
    const result = await api.post(`/tests/${testId}/history`, {
      notes: notes || ''
    });
    
    if (result.success) {
      showNotification('使用記録を保存しました', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('Error recording test usage:', error);
    showNotification('使用記録の保存に失敗しました', 'error');
  }
}

function duplicateTest(testId) {
  showNotification('テスト複製機能は今後実装予定です', 'info');
}

async function downloadTest(testId) {
  try {
    showLoading();
    const result = await api.get(`/tests/${testId}`);
    
    if (result.success) {
      const { test, items } = result.data;
      showPDFOptionsModal(test, items);
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('Error loading test for PDF:', error);
    showNotification('テスト情報の取得に失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

function showPDFOptionsModal(test, items) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content max-w-md">
      <div class="modal-header">
        <h3 class="text-lg font-medium">PDF生成オプション</h3>
      </div>
      <div class="modal-body space-y-4">
        <div>
          <h4 class="font-medium text-gray-900 mb-2">テスト情報</h4>
          <div class="bg-gray-50 p-3 rounded text-sm">
            <p><strong>タイトル:</strong> ${test.title}</p>
            <p><strong>問題数:</strong> ${test.question_count}問</p>
            <p><strong>タイプ:</strong> ${getTestTypeLabel(test.test_type)}</p>
          </div>
        </div>
        
        <div>
          <h4 class="font-medium text-gray-900 mb-2">生成オプション</h4>
          <div class="space-y-2">
            <label class="flex items-center">
              <input type="checkbox" id="generate-questions" checked class="mr-2">
              <span class="text-sm">問題用PDF</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" id="generate-answers" checked class="mr-2">
              <span class="text-sm">解答用PDF</span>
            </label>
          </div>
        </div>
        
        <div>
          <h4 class="font-medium text-gray-900 mb-2">レイアウト設定</h4>
          <div class="space-y-2">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">問題数/ページ</label>
              <select id="questions-per-page" class="input-field">
                <option value="15">15問</option>
                <option value="20" selected>20問</option>
                <option value="25">25問</option>
                <option value="30">30問</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">フォントサイズ</label>
              <select id="font-size" class="input-field">
                <option value="12">小 (12pt)</option>
                <option value="14" selected>中 (14pt)</option>
                <option value="16">大 (16pt)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="this.closest('.modal').remove()" class="btn-secondary">キャンセル</button>
        <button onclick="generatePDF(${test.id}, '${test.title}', ${JSON.stringify(items).replace(/"/g, '&quot;')})" class="btn-primary">
          <i class="fas fa-file-pdf mr-2"></i>PDF生成
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function generatePDF(testId, testTitle, items) {
  const generateQuestions = document.getElementById('generate-questions').checked;
  const generateAnswers = document.getElementById('generate-answers').checked;
  const questionsPerPage = parseInt(document.getElementById('questions-per-page').value);
  const fontSize = parseInt(document.getElementById('font-size').value);
  
  if (!generateQuestions && !generateAnswers) {
    showNotification('少なくとも1つのPDFタイプを選択してください', 'warning');
    return;
  }
  
  try {
    showLoading();
    
    // Close the modal
    document.querySelector('.modal').remove();
    
    if (generateQuestions) {
      await createTestPDF(testTitle, items, false, questionsPerPage, fontSize);
    }
    
    if (generateAnswers) {
      await createTestPDF(testTitle, items, true, questionsPerPage, fontSize);
    }
    
    showNotification('PDF生成が完了しました', 'success');
    
  } catch (error) {
    console.error('PDF generation error:', error);
    showNotification('PDF生成に失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

async function createTestPDF(testTitle, items, includeAnswers, questionsPerPage, fontSize) {
  const { jsPDF } = window.jspdf;
  
  // A4 size: 210mm x 297mm
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Japanese font support
  pdf.setFont('helvetica');
  
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - (margin * 2);
  
  // Header
  const headerHeight = 30;
  pdf.setFontSize(16);
  pdf.text(testTitle, margin, margin + 10);
  
  pdf.setFontSize(12);
  const subtitle = includeAnswers ? '【解答用紙】' : '【問題用紙】';
  pdf.text(subtitle, margin, margin + 20);
  
  const currentDate = new Date().toLocaleDateString('ja-JP');
  pdf.text(`実施日: ${currentDate}`, pageWidth - margin - 50, margin + 10);
  
  // Student info section (only for question paper)
  if (!includeAnswers) {
    pdf.rect(margin, margin + 25, contentWidth, 15);
    pdf.text('氏名:', margin + 5, margin + 35);
    pdf.text('得点:', pageWidth - margin - 30, margin + 35);
  }
  
  // Questions
  let currentY = margin + headerHeight + (includeAnswers ? 10 : 25);
  const lineHeight = fontSize * 0.4;
  const questionSpacing = lineHeight * 2.5;
  
  pdf.setFontSize(fontSize);
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const questionNum = item.question_order;
    
    // Check if we need a new page
    if (currentY + questionSpacing > pageHeight - margin) {
      pdf.addPage();
      currentY = margin + 20;
    }
    
    // Question number
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175); // Blue color
    pdf.text(`${questionNum}.`, margin, currentY);
    
    // Question content
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    let questionText = '';
    let answerText = '';
    
    if (item.question_type === 'english_to_japanese') {
      questionText = item.english;
      answerText = item.japanese;
    } else {
      questionText = item.japanese;
      answerText = item.english;
    }
    
    // Question text
    pdf.text(questionText, margin + 15, currentY);
    
    if (includeAnswers) {
      // Show answer
      pdf.setTextColor(100, 100, 100);
      pdf.text(`→ ${answerText}`, margin + 15, currentY + lineHeight);
    } else {
      // Answer line
      const answerLineY = currentY + lineHeight;
      pdf.line(margin + 15, answerLineY, pageWidth - margin, answerLineY);
    }
    
    currentY += questionSpacing;
  }
  
  // Footer
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  const totalPages = pdf.internal.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
    pdf.text(`総問題数: ${items.length}問`, margin, pageHeight - 10);
  }
  
  // Download
  const filename = `${testTitle}_${includeAnswers ? '解答用紙' : '問題用紙'}_${currentDate.replace(/\//g, '')}.pdf`;
  pdf.save(filename);
}

function loadRecentTests() {
  showSection('tests');
}

// CSV Import functionality
let csvData = null;

function setupCSVDropZone() {
  const dropZone = document.getElementById('csv-drop-zone');
  const fileInput = document.getElementById('csv-file-input');
  
  // Drag and drop events
  dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  
  dropZone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  });
  
  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleCSVFile(files[0]);
    }
  });
  
  // File input change
  fileInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
      handleCSVFile(e.target.files[0]);
    }
  });
}

function handleCSVFile(file) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showNotification('CSVファイルを選択してください', 'error');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    showNotification('ファイルサイズが大きすぎます（5MB以下）', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const text = e.target.result;
      parseCSVContent(text);
    } catch (error) {
      showNotification('ファイルの読み込みに失敗しました', 'error');
    }
  };
  
  reader.readAsText(file, 'UTF-8');
}

function parseCSVContent(text) {
  try {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      showNotification('CSVファイルには少なくとも2行（ヘッダー+データ）が必要です', 'error');
      return;
    }
    
    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['english', 'japanese'];
    const optionalFields = ['category', 'difficulty'];
    
    // Validate header
    for (const field of requiredFields) {
      if (!header.includes(field)) {
        showNotification(`必須フィールド「${field}」がヘッダーに見つかりません`, 'error');
        return;
      }
    }
    
    // Parse data rows
    const parsedData = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length < requiredFields.length) {
        errors.push(`行 ${i + 1}: 必須フィールドが不足しています`);
        continue;
      }
      
      const row = {};
      header.forEach((field, index) => {
        if (index < values.length) {
          row[field] = values[index];
        }
      });
      
      // Validate required fields
      if (!row.english || !row.japanese) {
        errors.push(`行 ${i + 1}: 英語または日本語が空です`);
        continue;
      }
      
      // Set defaults
      if (!row.category) row.category = '基本単語';
      if (!row.difficulty || isNaN(parseInt(row.difficulty))) {
        row.difficulty = 1;
      } else {
        row.difficulty = Math.min(5, Math.max(1, parseInt(row.difficulty)));
      }
      
      parsedData.push(row);
    }
    
    if (parsedData.length === 0) {
      showNotification('有効なデータ行が見つかりませんでした', 'error');
      return;
    }
    
    csvData = parsedData;
    showCSVPreview(parsedData, errors);
    
  } catch (error) {
    console.error('CSV parsing error:', error);
    showNotification('CSVファイルの解析に失敗しました', 'error');
  }
}

function showCSVPreview(data, errors) {
  const previewDiv = document.getElementById('csv-preview');
  const contentDiv = document.getElementById('csv-preview-content');
  const optionsDiv = document.getElementById('import-options');
  const importBtn = document.getElementById('import-btn');
  
  let content = `
    <div class="mb-3">
      <span class="text-green-600">✓ ${data.length}件のデータを検出</span>
      ${errors.length > 0 ? `<span class="text-red-600 ml-4">⚠ ${errors.length}件のエラー</span>` : ''}
    </div>
  `;
  
  if (errors.length > 0) {
    content += `
      <div class="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
        <div class="font-medium text-red-800 mb-1">エラー詳細:</div>
        ${errors.slice(0, 5).map(error => `<div class="text-red-700">• ${error}</div>`).join('')}
        ${errors.length > 5 ? `<div class="text-red-600">...他 ${errors.length - 5}件</div>` : ''}
      </div>
    `;
  }
  
  content += `
    <div class="text-sm">
      <div class="font-medium mb-1">プレビュー（最初の5件）:</div>
      ${data.slice(0, 5).map((row, index) => `
        <div class="border-b border-gray-200 py-1">
          <span class="font-medium">${row.english}</span> → ${row.japanese} 
          <span class="text-gray-500">[${row.category}, 難易度${row.difficulty}]</span>
        </div>
      `).join('')}
      ${data.length > 5 ? `<div class="text-gray-500 py-1">...他 ${data.length - 5}件</div>` : ''}
    </div>
  `;
  
  contentDiv.innerHTML = content;
  previewDiv.classList.remove('hidden');
  optionsDiv.classList.remove('hidden');
  importBtn.disabled = false;
}

async function executeImport() {
  if (!csvData || csvData.length === 0) {
    showNotification('インポートするデータがありません', 'error');
    return;
  }
  
  const skipDuplicates = document.getElementById('skip-duplicates').checked;
  const createCategories = document.getElementById('create-categories').checked;
  
  try {
    showLoading();
    
    const result = await api.post('/words/import', {
      words: csvData,
      options: {
        skip_duplicates: skipDuplicates,
        create_categories: createCategories
      }
    });
    
    if (result.success) {
      showNotification(result.message, 'success');
      document.querySelector('.modal').remove();
      loadWords(); // Refresh the words list
      
      if (result.data.errors > 0) {
        setTimeout(() => {
          showNotification(`${result.data.errors}件のエラーがありました。詳細はコンソールを確認してください。`, 'warning');
        }, 1000);
      }
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('Import error:', error);
    showNotification('インポートに失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

async function submitAddWord() {
  const english = document.getElementById('word-english').value.trim();
  const japanese = document.getElementById('word-japanese').value.trim();
  const categoryId = document.getElementById('word-category').value;
  const difficulty = document.getElementById('word-difficulty').value;
  
  if (!english || !japanese) {
    showNotification('英語と日本語を入力してください', 'warning');
    return;
  }
  
  try {
    showLoading();
    const result = await api.post('/words', {
      english,
      japanese,
      category_id: parseInt(categoryId),
      difficulty: parseInt(difficulty)
    });
    
    if (result.success) {
      showNotification(result.message, 'success');
      document.querySelector('.modal').remove();
      loadWords(); // Refresh the words list
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    console.error('Add word error:', error);
    showNotification('単語の追加に失敗しました', 'error');
  } finally {
    hideLoading();
  }
}

function populateModalCategories(selectId) {
  const select = document.getElementById(selectId);
  if (!select || currentCategories.length === 0) return;
  
  select.innerHTML = '';
  currentCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    select.appendChild(option);
  });
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  // Load dashboard by default
  showSection('dashboard');
  
  // Set up event listeners
  document.getElementById('word-search').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchWords();
    }
  });
  
  // Auto-load word selection list when category changes
  document.getElementById('test-category').addEventListener('change', function() {
    if (document.getElementById('selection-type').value === 'individual') {
      loadWordSelectionList();
    }
  });
});
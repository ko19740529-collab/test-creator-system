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
  // Implementation for add word modal
  showNotification('単語追加機能は次のアップデートで実装予定です', 'info');
}

function showImportModal() {
  // Implementation for CSV import modal
  showNotification('CSVインポート機能は次のアップデートで実装予定です', 'info');
}

function showCreateTestModal() {
  // Implementation for create test modal
  showNotification('専用テスト作成機能は次のアップデートで実装予定です', 'info');
}

function editWord(wordId) {
  // Implementation for edit word
  showNotification('単語編集機能は次のアップデートで実装予定です', 'info');
}

function viewTest(testId) {
  // Implementation for view test
  showNotification('テスト表示機能は次のアップデートで実装予定です', 'info');
}

function downloadTest(testId) {
  // Implementation for PDF download
  showNotification('PDF生成機能は次のアップデートで実装予定です', 'info');
}

function loadRecentTests() {
  showSection('tests');
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
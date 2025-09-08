-- Categories table for organizing words
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Words table for storing vocabulary data
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  english TEXT NOT NULL,
  japanese TEXT NOT NULL,
  category_id INTEGER DEFAULT 1,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  frequency INTEGER DEFAULT 0,  -- Usage frequency for weighted selection
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET DEFAULT
);

-- Tests table for storing test configurations
CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL CHECK (test_type IN ('english_to_japanese', 'japanese_to_english', 'mixed')),
  question_count INTEGER NOT NULL,
  category_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Test items table for storing specific questions in each test
CREATE TABLE IF NOT EXISTS test_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  question_order INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('english_to_japanese', 'japanese_to_english')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

-- Test history table for tracking test usage and performance
CREATE TABLE IF NOT EXISTS test_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_words_category ON words(category_id);
CREATE INDEX IF NOT EXISTS idx_words_difficulty ON words(difficulty);
CREATE INDEX IF NOT EXISTS idx_words_frequency ON words(frequency);
CREATE INDEX IF NOT EXISTS idx_words_english ON words(english);
CREATE INDEX IF NOT EXISTS idx_words_japanese ON words(japanese);
CREATE INDEX IF NOT EXISTS idx_test_items_test_id ON test_items(test_id);
CREATE INDEX IF NOT EXISTS idx_test_items_word_id ON test_items(word_id);
CREATE INDEX IF NOT EXISTS idx_test_history_test_id ON test_history(test_id);
CREATE INDEX IF NOT EXISTS idx_test_history_used_at ON test_history(used_at);

-- Insert default category
INSERT OR IGNORE INTO categories (id, name, description) VALUES 
  (1, '基本単語', 'デフォルトカテゴリ');
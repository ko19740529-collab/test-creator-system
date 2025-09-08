-- Insert categories (skip ID 1 since it already exists)
INSERT OR IGNORE INTO categories (id, name, description) VALUES 
  (1, '基本単語', '基礎的な英単語'),
  (2, '中学英語', '中学レベルの英単語'),
  (3, '高校英語', '高校レベルの英単語'),
  (4, '大学受験', '大学受験レベルの英単語'),
  (5, '英検準2級', '英検準2級レベルの英単語'),
  (6, '英検2級', '英検2級レベルの英単語'),
  (7, 'TOEIC', 'TOEIC頻出英単語');

-- Insert sample words
INSERT OR IGNORE INTO words (english, japanese, category_id, difficulty) VALUES 
  -- 基本単語 (category_id: 1)
  ('apple', 'りんご', 1, 1),
  ('book', '本', 1, 1),
  ('cat', '猫', 1, 1),
  ('dog', '犬', 1, 1),
  ('eye', '目', 1, 1),
  ('fish', '魚', 1, 1),
  ('green', '緑の', 1, 1),
  ('house', '家', 1, 1),
  ('ice', '氷', 1, 1),
  ('jump', '跳ぶ', 1, 1),
  
  -- 中学英語 (category_id: 2)
  ('beautiful', '美しい', 2, 2),
  ('difficult', '難しい', 2, 2),
  ('important', '重要な', 2, 2),
  ('interesting', '興味深い', 2, 2),
  ('necessary', '必要な', 2, 2),
  ('popular', '人気のある', 2, 2),
  ('serious', '真剣な', 2, 2),
  ('surprised', '驚いた', 2, 2),
  ('wonderful', '素晴らしい', 2, 2),
  ('yesterday', '昨日', 2, 2),
  
  -- 高校英語 (category_id: 3)
  ('achievement', '成果', 3, 3),
  ('advantage', '利点', 3, 3),
  ('argument', '議論', 3, 3),
  ('attitude', '態度', 3, 3),
  ('authority', '権威', 3, 3),
  ('challenge', '挑戦', 3, 3),
  ('condition', '条件', 3, 3),
  ('decision', '決定', 3, 3),
  ('environment', '環境', 3, 3),
  ('experience', '経験', 3, 3),
  
  -- 大学受験 (category_id: 4)
  ('accelerate', '加速する', 4, 4),
  ('acquire', '獲得する', 4, 4),
  ('analyze', '分析する', 4, 4),
  ('appreciate', '感謝する', 4, 4),
  ('concentrate', '集中する', 4, 4),
  ('demonstrate', '証明する', 4, 4),
  ('establish', '設立する', 4, 4),
  ('evaluate', '評価する', 4, 4),
  ('investigate', '調査する', 4, 4),
  ('participate', '参加する', 4, 4),
  
  -- 英検準2級 (category_id: 5)
  ('ancient', '古代の', 5, 3),
  ('celebrate', '祝う', 5, 3),
  ('destroy', '破壊する', 5, 3),
  ('disappear', '消える', 5, 3),
  ('encourage', '励ます', 5, 3),
  ('examine', '調べる', 5, 3),
  ('festival', '祭り', 5, 3),
  ('generation', '世代', 5, 3),
  ('material', '材料', 5, 3),
  ('ordinary', '普通の', 5, 3),
  
  -- 英検2級 (category_id: 6)
  ('considerable', 'かなりの', 6, 4),
  ('contribute', '貢献する', 6, 4),
  ('democracy', '民主主義', 6, 4),
  ('economy', '経済', 6, 4),
  ('external', '外部の', 6, 4),
  ('foundation', '基礎', 6, 4),
  ('government', '政府', 6, 4),
  ('individual', '個人の', 6, 4),
  ('negotiate', '交渉する', 6, 4),
  ('opportunity', '機会', 6, 4),
  
  -- TOEIC (category_id: 7)
  ('accounting', '会計', 7, 4),
  ('budget', '予算', 7, 4),
  ('conference', '会議', 7, 4),
  ('deadline', '締切', 7, 4),
  ('employee', '従業員', 7, 4),
  ('finance', '金融', 7, 4),
  ('guarantee', '保証', 7, 4),
  ('invoice', '請求書', 7, 4),
  ('manager', '管理者', 7, 4),
  ('revenue', '収益', 7, 4);

-- Insert sample test
INSERT OR IGNORE INTO tests (title, description, test_type, question_count, category_id) VALUES 
  ('基本単語テスト', '基本的な英単語のテスト', 'english_to_japanese', 10, 1),
  ('中学英語復習テスト', '中学レベル英単語の復習', 'mixed', 15, 2),
  ('英検準2級対策', '英検準2級レベルの単語テスト', 'japanese_to_english', 20, 5);
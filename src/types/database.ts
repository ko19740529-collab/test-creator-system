// Database type definitions for the test creation system

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Word {
  id: number;
  english: string;
  japanese: string;
  category_id: number;
  difficulty: number; // 1-5
  frequency: number;
  created_at: string;
  updated_at: string;
}

export interface WordWithCategory extends Word {
  category_name: string;
}

export interface Test {
  id: number;
  title: string;
  description?: string;
  test_type: 'english_to_japanese' | 'japanese_to_english' | 'mixed';
  question_count: number;
  category_id?: number;
  created_at: string;
}

export interface TestWithCategory extends Test {
  category_name?: string;
}

export interface TestItem {
  id: number;
  test_id: number;
  word_id: number;
  question_order: number;
  question_type: 'english_to_japanese' | 'japanese_to_english';
  created_at: string;
}

export interface TestItemWithWord extends TestItem {
  english: string;
  japanese: string;
}

export interface TestHistory {
  id: number;
  test_id: number;
  used_at: string;
  notes?: string;
}

export interface TestCreationRequest {
  title: string;
  description?: string;
  test_type: 'english_to_japanese' | 'japanese_to_english' | 'mixed';
  category_id?: number;
  word_selection: {
    type: 'range' | 'individual' | 'random';
    start_id?: number;
    end_id?: number;
    word_ids?: number[];
    count?: number;
  };
  randomize_order?: boolean;
}

export interface CSVImportRow {
  english: string;
  japanese: string;
  category?: string;
  difficulty?: number;
}

// Cloudflare Bindings
export interface CloudflareBindings {
  DB: D1Database;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
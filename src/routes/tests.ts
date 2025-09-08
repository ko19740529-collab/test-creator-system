import { Hono } from 'hono'
import type { 
  CloudflareBindings, 
  Test, 
  TestWithCategory, 
  TestItem, 
  TestItemWithWord, 
  TestCreationRequest, 
  ApiResponse 
} from '../types/database'

const tests = new Hono<{ Bindings: CloudflareBindings }>()

// Get all tests
tests.get('/', async (c) => {
  try {
    const { limit = '20', offset = '0' } = c.req.query()

    const { results } = await c.env.DB.prepare(`
      SELECT t.*, c.name as category_name
      FROM tests t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(parseInt(limit), parseInt(offset)).all()

    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM tests
    `).first()

    return c.json({
      success: true,
      data: {
        tests: results as TestWithCategory[],
        total: countResult?.count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    } as ApiResponse)

  } catch (error) {
    console.error('Error fetching tests:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch tests'
    } as ApiResponse, 500)
  }
})

// Get test by ID with items
tests.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Get test details
    const test = await c.env.DB.prepare(`
      SELECT t.*, c.name as category_name
      FROM tests t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).bind(id).first()

    if (!test) {
      return c.json({
        success: false,
        error: 'Test not found'
      } as ApiResponse, 404)
    }

    // Get test items with word details
    const { results: items } = await c.env.DB.prepare(`
      SELECT ti.*, w.english, w.japanese
      FROM test_items ti
      JOIN words w ON ti.word_id = w.id
      WHERE ti.test_id = ?
      ORDER BY ti.question_order
    `).bind(id).all()

    return c.json({
      success: true,
      data: {
        test: test as TestWithCategory,
        items: items as TestItemWithWord[]
      }
    } as ApiResponse)

  } catch (error) {
    console.error('Error fetching test:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch test'
    } as ApiResponse, 500)
  }
})

// Create new test
tests.post('/', async (c) => {
  try {
    const request = await c.req.json() as TestCreationRequest

    const { title, description, test_type, category_id, word_selection, randomize_order } = request

    if (!title || !test_type || !word_selection) {
      return c.json({
        success: false,
        error: 'Title, test_type, and word_selection are required'
      } as ApiResponse, 400)
    }

    // Get words based on selection method
    let selectedWords: any[] = []

    if (word_selection.type === 'range') {
      if (!word_selection.start_id || !word_selection.end_id) {
        return c.json({
          success: false,
          error: 'Start and end IDs are required for range selection'
        } as ApiResponse, 400)
      }

      const { results } = await c.env.DB.prepare(`
        SELECT * FROM words 
        WHERE id BETWEEN ? AND ?
        ${category_id ? 'AND category_id = ?' : ''}
        ORDER BY id
      `).bind(
        word_selection.start_id, 
        word_selection.end_id,
        ...(category_id ? [category_id] : [])
      ).all()

      selectedWords = results
    } 
    else if (word_selection.type === 'individual') {
      if (!word_selection.word_ids || word_selection.word_ids.length === 0) {
        return c.json({
          success: false,
          error: 'Word IDs are required for individual selection'
        } as ApiResponse, 400)
      }

      const placeholders = word_selection.word_ids.map(() => '?').join(',')
      const { results } = await c.env.DB.prepare(`
        SELECT * FROM words WHERE id IN (${placeholders})
      `).bind(...word_selection.word_ids).all()

      selectedWords = results
    }
    else if (word_selection.type === 'random') {
      if (!word_selection.count) {
        return c.json({
          success: false,
          error: 'Count is required for random selection'
        } as ApiResponse, 400)
      }

      const { results } = await c.env.DB.prepare(`
        SELECT * FROM words 
        ${category_id ? 'WHERE category_id = ?' : ''}
        ORDER BY RANDOM() 
        LIMIT ?
      `).bind(
        ...(category_id ? [category_id] : []),
        word_selection.count
      ).all()

      selectedWords = results
    }

    if (selectedWords.length === 0) {
      return c.json({
        success: false,
        error: 'No words found for the specified selection criteria'
      } as ApiResponse, 400)
    }

    // Randomize order if requested
    if (randomize_order) {
      selectedWords.sort(() => Math.random() - 0.5)
    }

    // Create test
    const testResult = await c.env.DB.prepare(`
      INSERT INTO tests (title, description, test_type, question_count, category_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(title, description, test_type, selectedWords.length, category_id).run()

    if (!testResult.success) {
      return c.json({
        success: false,
        error: 'Failed to create test'
      } as ApiResponse, 500)
    }

    const testId = testResult.meta.last_row_id

    // Create test items
    for (let i = 0; i < selectedWords.length; i++) {
      const word = selectedWords[i]
      let questionType = test_type

      // For mixed tests, alternate between question types
      if (test_type === 'mixed') {
        questionType = i % 2 === 0 ? 'english_to_japanese' : 'japanese_to_english'
      }

      await c.env.DB.prepare(`
        INSERT INTO test_items (test_id, word_id, question_order, question_type)
        VALUES (?, ?, ?, ?)
      `).bind(testId, word.id, i + 1, questionType).run()
    }

    return c.json({
      success: true,
      data: { id: testId, question_count: selectedWords.length },
      message: 'Test created successfully'
    } as ApiResponse, 201)

  } catch (error) {
    console.error('Error creating test:', error)
    return c.json({
      success: false,
      error: 'Failed to create test'
    } as ApiResponse, 500)
  }
})

// Preview test (without saving)
tests.post('/preview', async (c) => {
  try {
    const request = await c.req.json() as TestCreationRequest

    const { test_type, category_id, word_selection, randomize_order } = request

    if (!test_type || !word_selection) {
      return c.json({
        success: false,
        error: 'test_type and word_selection are required'
      } as ApiResponse, 400)
    }

    // Get words based on selection method (same logic as create)
    let selectedWords: any[] = []

    if (word_selection.type === 'range') {
      if (!word_selection.start_id || !word_selection.end_id) {
        return c.json({
          success: false,
          error: 'Start and end IDs are required for range selection'
        } as ApiResponse, 400)
      }

      const { results } = await c.env.DB.prepare(`
        SELECT w.*, c.name as category_name FROM words w
        LEFT JOIN categories c ON w.category_id = c.id
        WHERE w.id BETWEEN ? AND ?
        ${category_id ? 'AND w.category_id = ?' : ''}
        ORDER BY w.id
      `).bind(
        word_selection.start_id, 
        word_selection.end_id,
        ...(category_id ? [category_id] : [])
      ).all()

      selectedWords = results
    } 
    else if (word_selection.type === 'individual') {
      if (!word_selection.word_ids || word_selection.word_ids.length === 0) {
        return c.json({
          success: false,
          error: 'Word IDs are required for individual selection'
        } as ApiResponse, 400)
      }

      const placeholders = word_selection.word_ids.map(() => '?').join(',')
      const { results } = await c.env.DB.prepare(`
        SELECT w.*, c.name as category_name FROM words w
        LEFT JOIN categories c ON w.category_id = c.id
        WHERE w.id IN (${placeholders})
      `).bind(...word_selection.word_ids).all()

      selectedWords = results
    }
    else if (word_selection.type === 'random') {
      if (!word_selection.count) {
        return c.json({
          success: false,
          error: 'Count is required for random selection'
        } as ApiResponse, 400)
      }

      const { results } = await c.env.DB.prepare(`
        SELECT w.*, c.name as category_name FROM words w
        LEFT JOIN categories c ON w.category_id = c.id
        ${category_id ? 'WHERE w.category_id = ?' : ''}
        ORDER BY RANDOM() 
        LIMIT ?
      `).bind(
        ...(category_id ? [category_id] : []),
        word_selection.count
      ).all()

      selectedWords = results
    }

    if (selectedWords.length === 0) {
      return c.json({
        success: false,
        error: 'No words found for the specified selection criteria'
      } as ApiResponse, 400)
    }

    // Randomize order if requested
    if (randomize_order) {
      selectedWords.sort(() => Math.random() - 0.5)
    }

    // Generate preview items
    const previewItems = selectedWords.map((word, index) => {
      let questionType = test_type

      // For mixed tests, alternate between question types
      if (test_type === 'mixed') {
        questionType = index % 2 === 0 ? 'english_to_japanese' : 'japanese_to_english'
      }

      return {
        question_order: index + 1,
        question_type: questionType,
        word: word
      }
    })

    return c.json({
      success: true,
      data: {
        items: previewItems,
        total_questions: selectedWords.length
      }
    } as ApiResponse)

  } catch (error) {
    console.error('Error previewing test:', error)
    return c.json({
      success: false,
      error: 'Failed to preview test'
    } as ApiResponse, 500)
  }
})

// Delete test
tests.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Delete test items first (cascade should handle this, but being explicit)
    await c.env.DB.prepare(`
      DELETE FROM test_items WHERE test_id = ?
    `).bind(id).run()

    // Delete test
    const result = await c.env.DB.prepare(`
      DELETE FROM tests WHERE id = ?
    `).bind(id).run()

    if (result.changes === 0) {
      return c.json({
        success: false,
        error: 'Test not found'
      } as ApiResponse, 404)
    }

    return c.json({
      success: true,
      message: 'Test deleted successfully'
    } as ApiResponse)

  } catch (error) {
    console.error('Error deleting test:', error)
    return c.json({
      success: false,
      error: 'Failed to delete test'
    } as ApiResponse, 500)
  }
})

// Record test usage
tests.post('/:id/history', async (c) => {
  try {
    const id = c.req.param('id')
    const { notes } = await c.req.json()

    const result = await c.env.DB.prepare(`
      INSERT INTO test_history (test_id, notes)
      VALUES (?, ?)
    `).bind(id, notes).run()

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Failed to record test usage'
      } as ApiResponse, 500)
    }

    return c.json({
      success: true,
      message: 'Test usage recorded successfully'
    } as ApiResponse, 201)

  } catch (error) {
    console.error('Error recording test usage:', error)
    return c.json({
      success: false,
      error: 'Failed to record test usage'
    } as ApiResponse, 500)
  }
})

export default tests
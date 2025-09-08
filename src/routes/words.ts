import { Hono } from 'hono'
import type { CloudflareBindings, Word, WordWithCategory, ApiResponse, CSVImportRow } from '../types/database'

const words = new Hono<{ Bindings: CloudflareBindings }>()

// Get all words with optional filtering
words.get('/', async (c) => {
  try {
    const { search, category_id, difficulty, limit = '50', offset = '0' } = c.req.query()
    
    let query = `
      SELECT w.*, c.name as category_name 
      FROM words w
      LEFT JOIN categories c ON w.category_id = c.id
      WHERE 1=1
    `
    const params: any[] = []

    if (search) {
      query += ` AND (w.english LIKE ? OR w.japanese LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }

    if (category_id) {
      query += ` AND w.category_id = ?`
      params.push(parseInt(category_id))
    }

    if (difficulty) {
      query += ` AND w.difficulty = ?`
      params.push(parseInt(difficulty))
    }

    query += ` ORDER BY w.id DESC LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))

    const { results } = await c.env.DB.prepare(query).bind(...params).all()

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as count FROM words w WHERE 1=1`
    const countParams: any[] = []
    
    if (search) {
      countQuery += ` AND (w.english LIKE ? OR w.japanese LIKE ?)`
      countParams.push(`%${search}%`, `%${search}%`)
    }
    if (category_id) {
      countQuery += ` AND w.category_id = ?`
      countParams.push(parseInt(category_id))
    }
    if (difficulty) {
      countQuery += ` AND w.difficulty = ?`
      countParams.push(parseInt(difficulty))
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first()

    return c.json({
      success: true,
      data: {
        words: results as WordWithCategory[],
        total: countResult?.count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    } as ApiResponse)

  } catch (error) {
    console.error('Error fetching words:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch words'
    } as ApiResponse, 500)
  }
})

// Get word by ID
words.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { results } = await c.env.DB.prepare(`
      SELECT w.*, c.name as category_name 
      FROM words w
      LEFT JOIN categories c ON w.category_id = c.id
      WHERE w.id = ?
    `).bind(id).all()

    if (results.length === 0) {
      return c.json({
        success: false,
        error: 'Word not found'
      } as ApiResponse, 404)
    }

    return c.json({
      success: true,
      data: results[0]
    } as ApiResponse)

  } catch (error) {
    console.error('Error fetching word:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch word'
    } as ApiResponse, 500)
  }
})

// Create new word
words.post('/', async (c) => {
  try {
    const { english, japanese, category_id = 1, difficulty = 1 } = await c.req.json()

    if (!english || !japanese) {
      return c.json({
        success: false,
        error: 'English and Japanese are required'
      } as ApiResponse, 400)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO words (english, japanese, category_id, difficulty)
      VALUES (?, ?, ?, ?)
    `).bind(english, japanese, category_id, difficulty).run()

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Failed to create word'
      } as ApiResponse, 500)
    }

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id },
      message: 'Word created successfully'
    } as ApiResponse, 201)

  } catch (error) {
    console.error('Error creating word:', error)
    return c.json({
      success: false,
      error: 'Failed to create word'
    } as ApiResponse, 500)
  }
})

// Update word
words.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { english, japanese, category_id, difficulty } = await c.req.json()

    const result = await c.env.DB.prepare(`
      UPDATE words 
      SET english = ?, japanese = ?, category_id = ?, difficulty = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(english, japanese, category_id, difficulty, id).run()

    if (result.changes === 0) {
      return c.json({
        success: false,
        error: 'Word not found'
      } as ApiResponse, 404)
    }

    return c.json({
      success: true,
      message: 'Word updated successfully'
    } as ApiResponse)

  } catch (error) {
    console.error('Error updating word:', error)
    return c.json({
      success: false,
      error: 'Failed to update word'
    } as ApiResponse, 500)
  }
})

// Delete word
words.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const result = await c.env.DB.prepare(`
      DELETE FROM words WHERE id = ?
    `).bind(id).run()

    if (result.changes === 0) {
      return c.json({
        success: false,
        error: 'Word not found'
      } as ApiResponse, 404)
    }

    return c.json({
      success: true,
      message: 'Word deleted successfully'
    } as ApiResponse)

  } catch (error) {
    console.error('Error deleting word:', error)
    return c.json({
      success: false,
      error: 'Failed to delete word'
    } as ApiResponse, 500)
  }
})

// Delete multiple words
words.delete('/', async (c) => {
  try {
    const { ids } = await c.req.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json({
        success: false,
        error: 'Valid IDs array is required'
      } as ApiResponse, 400)
    }

    const placeholders = ids.map(() => '?').join(',')
    const result = await c.env.DB.prepare(`
      DELETE FROM words WHERE id IN (${placeholders})
    `).bind(...ids).run()

    return c.json({
      success: true,
      data: { deletedCount: result.changes },
      message: `${result.changes} words deleted successfully`
    } as ApiResponse)

  } catch (error) {
    console.error('Error deleting words:', error)
    return c.json({
      success: false,
      error: 'Failed to delete words'
    } as ApiResponse, 500)
  }
})

// Import words from CSV
words.post('/import', async (c) => {
  try {
    const { words: importWords, options = {} } = await c.req.json()

    if (!Array.isArray(importWords) || importWords.length === 0) {
      return c.json({
        success: false,
        error: 'Valid words array is required'
      } as ApiResponse, 400)
    }

    const { skip_duplicates = true, create_categories = true } = options

    let successCount = 0
    let skippedCount = 0
    let errors: string[] = []

    // Process in batches for better performance
    for (const wordData of importWords) {
      try {
        const { english, japanese, category = '基本単語', difficulty = 1 } = wordData as CSVImportRow

        if (!english || !japanese) {
          errors.push(`Skipping invalid row: missing english or japanese`)
          continue
        }

        // Check for duplicates if skip_duplicates is enabled
        if (skip_duplicates) {
          const existingWord = await c.env.DB.prepare(`
            SELECT id FROM words WHERE LOWER(english) = LOWER(?) OR LOWER(japanese) = LOWER(?)
          `).bind(english.trim(), japanese.trim()).first()

          if (existingWord) {
            skippedCount++
            continue
          }
        }

        // Get or create category
        let categoryId = 1 // Default category
        if (category && category !== '基本単語') {
          const categoryResult = await c.env.DB.prepare(`
            SELECT id FROM categories WHERE name = ?
          `).bind(category).first()

          if (!categoryResult) {
            if (create_categories) {
              const newCategory = await c.env.DB.prepare(`
                INSERT INTO categories (name, description) VALUES (?, ?)
              `).bind(category, `Imported category: ${category}`).run()
              categoryId = newCategory.meta.last_row_id as number
            } else {
              errors.push(`Category "${category}" not found for word: ${english}`)
              continue
            }
          } else {
            categoryId = categoryResult.id as number
          }
        }

        // Validate and normalize difficulty
        const normalizedDifficulty = Math.min(5, Math.max(1, parseInt(difficulty?.toString()) || 1))

        // Insert word
        const result = await c.env.DB.prepare(`
          INSERT INTO words (english, japanese, category_id, difficulty)
          VALUES (?, ?, ?, ?)
        `).bind(english.trim(), japanese.trim(), categoryId, normalizedDifficulty).run()

        if (result.success) {
          successCount++
        } else {
          errors.push(`Failed to insert word: ${english}`)
        }
      } catch (error) {
        errors.push(`Error importing word ${wordData.english}: ${error}`)
      }
    }

    const totalProcessed = successCount + skippedCount + errors.length
    let message = `Successfully imported ${successCount} words`
    
    if (skippedCount > 0) {
      message += `, skipped ${skippedCount} duplicates`
    }
    
    if (errors.length > 0) {
      message += `, ${errors.length} errors occurred`
    }

    return c.json({
      success: true,
      data: {
        imported: successCount,
        skipped: skippedCount,
        errors: errors.length,
        total_processed: totalProcessed,
        errorDetails: errors.slice(0, 10) // Limit error details
      },
      message
    } as ApiResponse)

  } catch (error) {
    console.error('Error importing words:', error)
    return c.json({
      success: false,
      error: 'Failed to import words'
    } as ApiResponse, 500)
  }
})

// Get words by range for test creation
words.get('/range/:start/:end', async (c) => {
  try {
    const start = parseInt(c.req.param('start'))
    const end = parseInt(c.req.param('end'))

    if (start > end) {
      return c.json({
        success: false,
        error: 'Start ID must be less than or equal to end ID'
      } as ApiResponse, 400)
    }

    const { results } = await c.env.DB.prepare(`
      SELECT w.*, c.name as category_name 
      FROM words w
      LEFT JOIN categories c ON w.category_id = c.id
      WHERE w.id BETWEEN ? AND ?
      ORDER BY w.id
    `).bind(start, end).all()

    return c.json({
      success: true,
      data: results as WordWithCategory[]
    } as ApiResponse)

  } catch (error) {
    console.error('Error fetching words by range:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch words by range'
    } as ApiResponse, 500)
  }
})

export default words
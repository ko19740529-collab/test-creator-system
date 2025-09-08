import { Hono } from 'hono'
import type { CloudflareBindings, Category, ApiResponse } from '../types/database'

const categories = new Hono<{ Bindings: CloudflareBindings }>()

// Get all categories
categories.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT c.*, COUNT(w.id) as word_count
      FROM categories c
      LEFT JOIN words w ON c.id = w.category_id
      GROUP BY c.id, c.name, c.description, c.created_at
      ORDER BY c.id
    `).all()

    return c.json({
      success: true,
      data: results as (Category & { word_count: number })[]
    } as ApiResponse)

  } catch (error) {
    console.error('Error fetching categories:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch categories'
    } as ApiResponse, 500)
  }
})

// Get category by ID
categories.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const category = await c.env.DB.prepare(`
      SELECT * FROM categories WHERE id = ?
    `).bind(id).first()

    if (!category) {
      return c.json({
        success: false,
        error: 'Category not found'
      } as ApiResponse, 404)
    }

    return c.json({
      success: true,
      data: category as Category
    } as ApiResponse)

  } catch (error) {
    console.error('Error fetching category:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch category'
    } as ApiResponse, 500)
  }
})

// Create new category
categories.post('/', async (c) => {
  try {
    const { name, description } = await c.req.json()

    if (!name) {
      return c.json({
        success: false,
        error: 'Category name is required'
      } as ApiResponse, 400)
    }

    // Check if category already exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM categories WHERE name = ?
    `).bind(name).first()

    if (existing) {
      return c.json({
        success: false,
        error: 'Category already exists'
      } as ApiResponse, 400)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO categories (name, description)
      VALUES (?, ?)
    `).bind(name, description).run()

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Failed to create category'
      } as ApiResponse, 500)
    }

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id },
      message: 'Category created successfully'
    } as ApiResponse, 201)

  } catch (error) {
    console.error('Error creating category:', error)
    return c.json({
      success: false,
      error: 'Failed to create category'
    } as ApiResponse, 500)
  }
})

// Update category
categories.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { name, description } = await c.req.json()

    if (!name) {
      return c.json({
        success: false,
        error: 'Category name is required'
      } as ApiResponse, 400)
    }

    // Check if another category with the same name exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM categories WHERE name = ? AND id != ?
    `).bind(name, id).first()

    if (existing) {
      return c.json({
        success: false,
        error: 'Category name already exists'
      } as ApiResponse, 400)
    }

    const result = await c.env.DB.prepare(`
      UPDATE categories 
      SET name = ?, description = ?
      WHERE id = ?
    `).bind(name, description, id).run()

    if (result.changes === 0) {
      return c.json({
        success: false,
        error: 'Category not found'
      } as ApiResponse, 404)
    }

    return c.json({
      success: true,
      message: 'Category updated successfully'
    } as ApiResponse)

  } catch (error) {
    console.error('Error updating category:', error)
    return c.json({
      success: false,
      error: 'Failed to update category'
    } as ApiResponse, 500)
  }
})

// Delete category
categories.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    if (id === '1') {
      return c.json({
        success: false,
        error: 'Cannot delete default category'
      } as ApiResponse, 400)
    }

    // Check if category has words
    const wordCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM words WHERE category_id = ?
    `).bind(id).first()

    if (wordCount && wordCount.count > 0) {
      // Move words to default category before deleting
      await c.env.DB.prepare(`
        UPDATE words SET category_id = 1 WHERE category_id = ?
      `).bind(id).run()
    }

    const result = await c.env.DB.prepare(`
      DELETE FROM categories WHERE id = ?
    `).bind(id).run()

    if (result.changes === 0) {
      return c.json({
        success: false,
        error: 'Category not found'
      } as ApiResponse, 404)
    }

    return c.json({
      success: true,
      message: 'Category deleted successfully'
    } as ApiResponse)

  } catch (error) {
    console.error('Error deleting category:', error)
    return c.json({
      success: false,
      error: 'Failed to delete category'
    } as ApiResponse, 500)
  }
})

// Get statistics
categories.get('/stats/overview', async (c) => {
  try {
    // Get total categories
    const totalCategories = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM categories
    `).first()

    // Get total words
    const totalWords = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM words
    `).first()

    // Get total tests
    const totalTests = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM tests
    `).first()

    return c.json({
      success: true,
      data: {
        categories: totalCategories?.count || 0,
        words: totalWords?.count || 0,
        tests: totalTests?.count || 0
      }
    } as ApiResponse)

  } catch (error) {
    console.error('Error fetching statistics:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch statistics'
    } as ApiResponse, 500)
  }
})

export default categories
import { Router } from 'express'
import { authenticate, requireLaundry, optionalAuth } from '../middleware/auth.js'
import { query } from '../config/database.js'
import { AppError, sendSuccess } from '../middleware/errorHandler.js'

const router = Router()

// ─── GET /api/v1/categories — List all categories ─────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM categories WHERE is_active = TRUE ORDER BY display_order ASC'
    )
    return sendSuccess(res, result.rows)
  } catch (err) { next(err) }
})

// ─── GET /api/v1/categories/:id/items — List items in category ────────────────
router.get('/:id/items', optionalAuth, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM items WHERE category_id = $1 AND is_active = TRUE ORDER BY name_ar ASC',
      [req.params.id]
    )
    return sendSuccess(res, result.rows)
  } catch (err) { next(err) }
})

// ─── GET /api/v1/categories/laundry/:laundryId — Laundry specific prices ──────
router.get('/laundry/:laundryId', optionalAuth, async (req, res, next) => {
  try {
    // Get categories with their items, and join with laundry custom prices if they exist
    const result = await query(
      `SELECT c.id AS category_id, c.name_ar AS cat_name_ar, c.name_en AS cat_name_en, c.icon,
              i.id AS item_id, i.name_ar, i.name_en, i.base_price,
              COALESCE(lp.price, i.base_price) AS current_price,
              lp.is_available
       FROM categories c
       JOIN items i ON i.category_id = c.id
       LEFT JOIN laundry_prices lp ON lp.item_id = i.id AND lp.laundry_id = $1
       WHERE c.is_active = TRUE AND i.is_active = TRUE AND (lp.is_available IS NULL OR lp.is_available = TRUE)
       ORDER BY c.display_order, i.name_ar`,
      [req.params.laundryId]
    )
    
    // Group by category
    const categoriesMap = new Map()
    result.rows.forEach(row => {
      if (!categoriesMap.has(row.category_id)) {
        categoriesMap.set(row.category_id, {
          id: row.category_id,
          name_ar: row.cat_name_ar,
          name_en: row.cat_name_en,
          icon: row.icon,
          items: []
        })
      }
      categoriesMap.get(row.category_id).items.push({
        id: row.item_id,
        name_ar: row.name_ar,
        name_en: row.name_en,
        base_price: row.base_price,
        current_price: row.current_price
      })
    })

    return sendSuccess(res, Array.from(categoriesMap.values()))
  } catch (err) { next(err) }
})

// ─── POST /api/v1/categories/me/prices — Update laundry prices ────────────────
router.post('/me/prices', authenticate, requireLaundry, async (req, res, next) => {
  try {
    const { prices } = req.body // [{ item_id, price, is_available }]
    if (!Array.isArray(prices)) throw new AppError('يجب إرسال قائمة الأسعار', 400)

    const laundryResult = await query('SELECT id FROM laundries WHERE owner_id = $1', [req.user.id])
    if (!laundryResult.rows[0]) throw new AppError('المغسلة غير موجودة', 404)
    const laundryId = laundryResult.rows[0].id

    for (const p of prices) {
      await query(
        `INSERT INTO laundry_prices (laundry_id, item_id, price, is_available)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (laundry_id, item_id)
         DO UPDATE SET price = EXCLUDED.price, is_available = EXCLUDED.is_available, updated_at = NOW()`,
        [laundryId, p.item_id, p.price, p.is_available ?? true]
      )
    }

    return sendSuccess(res, null, 'تم تحديث قائمة الأسعار بنجاح')
  } catch (err) { next(err) }
})

export default router

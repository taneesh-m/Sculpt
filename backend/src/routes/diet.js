import express from 'express'
import { body, validationResult } from 'express-validator'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// Get all diet logs
router.get('/logs', async (req, res) => {
  try {
    const { data: dietLogs, error } = await supabase
      .from('diet_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch diet logs' })
    }

    res.json({ dietLogs })
  } catch (error) {
    console.error('Get diet logs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get diet logs for a specific date
router.get('/logs/:date', async (req, res) => {
  try {
    const { date } = req.params

    const { data: dietLogs, error } = await supabase
      .from('diet_logs')
      .select('*')
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`)
      .order('created_at', { ascending: true })

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch diet logs' })
    }

    res.json({ dietLogs })
  } catch (error) {
    console.error('Get diet logs by date error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create a new diet log entry
router.post('/logs', [
  body('food_name').trim().isLength({ min: 1 }),
  body('calories').isFloat({ min: 0 }),
  body('protein').optional().isFloat({ min: 0 }),
  body('carbs').optional().isFloat({ min: 0 }),
  body('fat').optional().isFloat({ min: 0 }),
  body('fiber').optional().isFloat({ min: 0 }),
  body('meal_type').isIn(['breakfast', 'lunch', 'dinner', 'snack']),
  body('serving_size').optional().trim(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      food_name,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      meal_type,
      serving_size,
      notes
    } = req.body

    const { data: dietLog, error } = await supabase
      .from('diet_logs')
      .insert([
        {
          food_name,
          calories,
          protein,
          carbs,
          fat,
          fiber,
          meal_type,
          serving_size,
          notes,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to create diet log' })
    }

    res.status(201).json({ dietLog })
  } catch (error) {
    console.error('Create diet log error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update a diet log entry
router.put('/logs/:id', [
  body('food_name').optional().trim().isLength({ min: 1 }),
  body('calories').optional().isFloat({ min: 0 }),
  body('protein').optional().isFloat({ min: 0 }),
  body('carbs').optional().isFloat({ min: 0 }),
  body('fat').optional().isFloat({ min: 0 }),
  body('fiber').optional().isFloat({ min: 0 }),
  body('meal_type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']),
  body('serving_size').optional().trim(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const updateData = { ...req.body, updated_at: new Date().toISOString() }

    const { data: dietLog, error } = await supabase
      .from('diet_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(404).json({ error: 'Diet log not found' })
    }

    res.json({ dietLog })
  } catch (error) {
    console.error('Update diet log error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete a diet log entry
router.delete('/logs/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('diet_logs')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(404).json({ error: 'Diet log not found' })
    }

    res.json({ message: 'Diet log deleted successfully' })
  } catch (error) {
    console.error('Delete diet log error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get nutrition goals
router.get('/goals', async (req, res) => {
  try {
    const { data: goals, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to fetch nutrition goals' })
    }

    res.json({ goals })
  } catch (error) {
    console.error('Get nutrition goals error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create or update nutrition goals
router.post('/goals', [
  body('daily_calories').optional().isFloat({ min: 0 }),
  body('daily_protein').optional().isFloat({ min: 0 }),
  body('daily_carbs').optional().isFloat({ min: 0 }),
  body('daily_fat').optional().isFloat({ min: 0 }),
  body('daily_fiber').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      daily_calories,
      daily_protein,
      daily_carbs,
      daily_fat,
      daily_fiber
    } = req.body

    // Check if goals already exist
    const { data: existingGoals } = await supabase
      .from('nutrition_goals')
      .select('id')
      .limit(1)
      .single()

    let result
    if (existingGoals) {
      // Update existing goals
      const { data: goals, error } = await supabase
        .from('nutrition_goals')
        .update({
          daily_calories,
          daily_protein,
          daily_carbs,
          daily_fat,
          daily_fiber,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGoals.id)
        .select()
        .single()

      if (error) {
        return res.status(500).json({ error: 'Failed to update nutrition goals' })
      }
      result = goals
    } else {
      // Create new goals
      const { data: goals, error } = await supabase
        .from('nutrition_goals')
        .insert([
          {
            daily_calories,
            daily_protein,
            daily_carbs,
            daily_fat,
            daily_fiber,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) {
        return res.status(500).json({ error: 'Failed to create nutrition goals' })
      }
      result = goals
    }

    res.json({ goals: result })
  } catch (error) {
    console.error('Create/update nutrition goals error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get nutrition summary for a date range
router.get('/summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query

    let query = supabase
      .from('diet_logs')
      .select('calories, protein, carbs, fat, fiber')

    if (start_date) {
      query = query.gte('created_at', `${start_date}T00:00:00`)
    }
    if (end_date) {
      query = query.lte('created_at', `${end_date}T23:59:59`)
    }

    const { data: logs, error } = await query

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch nutrition summary' })
    }

    // Calculate totals
    const summary = logs.reduce((acc, log) => {
      acc.calories += log.calories || 0
      acc.protein += log.protein || 0
      acc.carbs += log.carbs || 0
      acc.fat += log.fat || 0
      acc.fiber += log.fiber || 0
      return acc
    }, {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    })

    res.json({ summary })
  } catch (error) {
    console.error('Get nutrition summary error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router 
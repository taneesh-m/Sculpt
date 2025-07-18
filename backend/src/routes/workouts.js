import express from 'express'
import { body, validationResult } from 'express-validator'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// Get all workouts
router.get('/', async (req, res) => {
  try {
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(`
        *,
        exercises (
          id,
          name,
          sets,
          reps,
          weight,
          duration,
          notes
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch workouts' })
    }

    res.json({ workouts })
  } catch (error) {
    console.error('Get workouts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get a specific workout
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: workout, error } = await supabase
      .from('workouts')
      .select(`
        *,
        exercises (
          id,
          name,
          sets,
          reps,
          weight,
          duration,
          notes
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return res.status(404).json({ error: 'Workout not found' })
    }

    res.json({ workout })
  } catch (error) {
    console.error('Get workout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create a new workout
router.post('/', [
  body('name').trim().isLength({ min: 1 }),
  body('type').isIn(['strength', 'cardio', 'flexibility', 'mixed']),
  body('duration').optional().isInt({ min: 1 }),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, type, duration, notes } = req.body

    const { data: workout, error } = await supabase
      .from('workouts')
      .insert([
        {
          name,
          type,
          duration,
          notes,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to create workout' })
    }

    res.status(201).json({ workout })
  } catch (error) {
    console.error('Create workout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update a workout
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1 }),
  body('type').optional().isIn(['strength', 'cardio', 'flexibility', 'mixed']),
  body('duration').optional().isInt({ min: 1 }),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const updateData = { ...req.body, updated_at: new Date().toISOString() }

    const { data: workout, error } = await supabase
      .from('workouts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(404).json({ error: 'Workout not found' })
    }

    res.json({ workout })
  } catch (error) {
    console.error('Update workout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete a workout
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(404).json({ error: 'Workout not found' })
    }

    res.json({ message: 'Workout deleted successfully' })
  } catch (error) {
    console.error('Delete workout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add exercise to workout
router.post('/:id/exercises', [
  body('name').trim().isLength({ min: 1 }),
  body('sets').optional().isInt({ min: 1 }),
  body('reps').optional().isInt({ min: 1 }),
  body('weight').optional().isFloat({ min: 0 }),
  body('duration').optional().isInt({ min: 1 }),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id: workoutId } = req.params
    const { name, sets, reps, weight, duration, notes } = req.body

    // Verify workout exists
    const { data: workout } = await supabase
      .from('workouts')
      .select('id')
      .eq('id', workoutId)
      .single()

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' })
    }

    const { data: exercise, error } = await supabase
      .from('exercises')
      .insert([
        {
          workout_id: workoutId,
          name,
          sets,
          reps,
          weight,
          duration,
          notes,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to add exercise' })
    }

    res.status(201).json({ exercise })
  } catch (error) {
    console.error('Add exercise error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router 
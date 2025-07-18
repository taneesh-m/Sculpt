import express from 'express'
import { body, validationResult } from 'express-validator'
import { supabase } from '../config/supabase.js'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const router = express.Router()

// Default user information (fallback)
const DEFAULT_USER_INFO = {
  name: "Alex",
  age: 28,
  gender: "male",
  height_cm: 175,
  weight_kg: 75,
  activity_level: "moderately_active",
  fitness_goals: ["build muscle", "improve strength", "lose body fat"],
  current_fitness_level: "intermediate",
  medical_conditions: [],
  dietary_restrictions: ["lactose intolerant"],
  preferred_workout_duration: 60,
  workout_frequency: 4,
  available_equipment: ["dumbbells", "barbell", "bench", "pull-up bar"],
  weight_goal: "lose",
  target_weight: 70,
  body_fat_percentage: 18,
  muscle_mass: 60
}

// Get chat history
router.get('/history', async (req, res) => {
  try {
    const { data: chatHistory, error } = await supabase
      .from('chat_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch chat history' })
    }

    res.json({ chatHistory })
  } catch (error) {
    console.error('Get chat history error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Send a message and get AI response
router.post('/send', [
  body('message').trim().isLength({ min: 1, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array())
      return res.status(400).json({ errors: errors.array() })
    }

    const { message, userSettings, conversationHistory = [] } = req.body
    
    console.log('Received chat request:', { message, userSettings, conversationHistoryLength: conversationHistory.length })
    
    // Use provided user settings or fall back to defaults
    let userInfo = userSettings || DEFAULT_USER_INFO

    // Validate that userInfo has the required properties
    if (!userInfo.name || !userInfo.age || !userInfo.gender) {
      console.log('Using default user info due to missing required fields')
      userInfo = DEFAULT_USER_INFO
    }

    // Single unified system prompt that handles both fitness and nutrition
    const systemPrompt = `You are a comprehensive fitness and nutrition AI assistant. You provide expert advice on both workout routines and dietary planning, seamlessly integrating both aspects when relevant. You speak as one unified assistant, not separate agents.

Your expertise includes:
- Workout planning and exercise recommendations
- Nutrition advice and meal planning
- Integration of diet and exercise for optimal results
- Personalized recommendations based on user goals

User Profile Context:
- Name: ${userInfo.name}
- Age: ${userInfo.age} years
- Gender: ${userInfo.gender}
- Height: ${userInfo.height_cm} cm
- Weight: ${userInfo.weight_kg} kg
- Activity Level: ${userInfo.activity_level}
- Fitness Goals: ${userInfo.fitness_goals.join(', ')}
- Current Fitness Level: ${userInfo.current_fitness_level}
- Medical Conditions: ${userInfo.medical_conditions.length > 0 ? userInfo.medical_conditions.join(', ') : 'none'}
- Dietary Restrictions: ${userInfo.dietary_restrictions.join(', ')}
- Preferred Workout Duration: ${userInfo.preferred_workout_duration} minutes
- Workout Frequency: ${userInfo.workout_frequency} days/week
- Available Equipment: ${userInfo.available_equipment.join(', ')}
- Weight Goal: ${userInfo.weight_goal}
- Target Weight: ${userInfo.target_weight} kg
- Body Fat Percentage: ${userInfo.body_fat_percentage}%
- Muscle Mass: ${userInfo.muscle_mass} kg

Guidelines:
1. Always respond as a single, unified assistant
2. When discussing workouts, include relevant nutrition advice
3. When discussing nutrition, mention complementary exercises
4. Provide specific, actionable recommendations
5. Use markdown formatting for better readability
6. For workout plans, structure them clearly with exercises, sets, reps, and notes
7. For meal plans, include nutritional information and dietary considerations
8. Consider the user's equipment, time constraints, and preferences
9. Maintain conversation context and build on previous recommendations

Remember: You are one assistant with comprehensive knowledge of both fitness and nutrition, not separate specialized agents.`

    // Build conversation context
    let conversationContext = ""
    if (conversationHistory.length > 0) {
      // Take the last 10 messages to maintain context without overwhelming the AI
      const recentMessages = conversationHistory.slice(-10)
      conversationContext = "\n\nPrevious conversation:\n" + recentMessages.map(msg => {
        const role = msg.role === 'user' ? 'User' : 'Assistant'
        return `${role}: ${msg.content}`
      }).join('\n')
    }

    // Create the full prompt with conversation context
    const fullPrompt = conversationContext ? `${conversationContext}\n\nUser: ${message}` : message

    // Generate AI response
    const response = await generateText({
      model: openai("gpt-4o"),
      prompt: fullPrompt,
      system: systemPrompt,
    })

    // Save the conversation to database
    const { error: saveError } = await supabase
      .from('chat_history')
      .insert([
        {
          user_message: message,
          ai_response: response.text,
          agent_type: "orchestrator",
          created_at: new Date().toISOString()
        }
      ])

    if (saveError) {
      console.error('Failed to save chat history:', saveError)
      // Don't fail the request if saving fails
    }

    res.json({
      content: response.text,
      agent: "orchestrator",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Failed to process chat message' })
  }
})

// Clear chat history
router.delete('/history', async (req, res) => {
  try {
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .neq('id', 0) // Delete all records

    if (error) {
      return res.status(500).json({ error: 'Failed to clear chat history' })
    }

    res.json({ message: 'Chat history cleared successfully' })
  } catch (error) {
    console.error('Clear chat history error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get chat statistics
router.get('/stats', async (req, res) => {
  try {
    const { data: chatHistory, error } = await supabase
      .from('chat_history')
      .select('agent_type, created_at')

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch chat statistics' })
    }

    // Calculate statistics
    const stats = {
      totalMessages: chatHistory.length,
      agentUsage: {
        orchestrator: 0,
        workout: 0,
        diet: 0
      },
      recentActivity: chatHistory.filter(chat => {
        const chatDate = new Date(chat.created_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return chatDate >= weekAgo
      }).length
    }

    // Count agent usage
    chatHistory.forEach(chat => {
      if (stats.agentUsage[chat.agent_type] !== undefined) {
        stats.agentUsage[chat.agent_type]++
      }
    })

    res.json({ stats })
  } catch (error) {
    console.error('Get chat stats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router 
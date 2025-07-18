import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for database operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema types (for reference)
export const TABLES = {
  WORKOUTS: 'workouts',
  EXERCISES: 'exercises',
  DIET_LOGS: 'diet_logs',
  NUTRITION_GOALS: 'nutrition_goals',
  CHAT_HISTORY: 'chat_history'
} 
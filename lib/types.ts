export type UserSettings = {
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  height_cm: number
  weight_kg: number
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  fitness_goals: string[]
  current_fitness_level: 'beginner' | 'intermediate' | 'advanced'
  medical_conditions: string[]
  dietary_restrictions: string[]
  preferred_workout_duration: number
  workout_frequency: number
  available_equipment: string[]
  weight_goal: 'lose' | 'maintain' | 'gain'
  target_weight: number
  body_fat_percentage: number
  muscle_mass: number
}

// The full profiles table row: the editable UserSettings fields plus the
// identity/audit columns owned by auth and the DB, not the client.
export type Profile = UserSettings & {
  id: string
  email: string
  avatar_url: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export type Exercise = {
  id: string
  name: string
  sets: number
  reps: number
  weight?: number
  duration?: number
  notes?: string
}

export type Workout = {
  id: string
  name: string
  type: 'strength' | 'cardio' | 'flexibility' | 'mixed'
  duration: number
  exercises: Exercise[]
  created_at: string
}

export type FoodItem = {
  id: string
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

// A single diet_logs row as stored/returned by the API (one row per food
// entry -- distinct from FoodItem, which is the client-side staging shape
// used while building up "today's foods" before it's committed).
export type DietLogRecord = {
  id: string
  food_name: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  serving_size?: string
  notes?: string
  created_at: string
}

export type DailyLog = {
  id: string
  date: string
  foods: FoodItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export type AIWorkoutPlan = {
  id: string
  title: string
  description: string
  type: string
  duration: number
  exercises: Exercise[]
  date: string
  targetMuscleGroups?: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export type AIMealPlan = {
  id: string
  title: string
  description: string
  dailyCalories: number
  meals: {
    name: string
    foods: FoodItem[]
    calories: number
    protein: number
    carbs: number
    fat: number
  }[]
  date: string
  dietaryNotes?: string[]
}

export type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: string
}

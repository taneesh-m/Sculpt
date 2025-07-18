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
  type: string
  duration: number
  exercises: Exercise[]
  date: Date
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
  mealType: string
}

export type DailyLog = {
  id: string
  date: Date
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
  date: Date
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
  date: Date
  dietaryNotes?: string[]
}

export type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  agent?: "orchestrator"
  timestamp: Date
} 
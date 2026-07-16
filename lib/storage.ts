import { AIWorkoutPlan, AIMealPlan, Message } from './types'

const STORAGE_KEYS = {
  AI_WORKOUT_PLANS: 'aiWorkoutPlans',
  AI_MEAL_PLANS: 'aiMealPlans',
  CHAT_MESSAGES: 'chatMessages'
} as const

// User settings, workout history, and diet history are now backed by the
// real API (see lib/hooks/use-profile.ts, use-workouts.ts, use-diet.ts).
// AI-generated plans and chat messages remain local until phase 4 promotes
// them to the ai_plans/chat_history tables.
export class StorageManager {
  // Chat Messages
  static getChatMessages(): Message[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading chat messages:', error)
      return []
    }
  }

  static saveChatMessages(messages: Message[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages))
    } catch (error) {
      console.error('Error saving chat messages:', error)
    }
  }

  static clearChatMessages(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES)
    } catch (error) {
      console.error('Error clearing chat messages:', error)
    }
  }

  // AI Workout Plans
  static getAIWorkoutPlans(): AIWorkoutPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AI_WORKOUT_PLANS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading AI workout plans:', error)
      return []
    }
  }

  static saveAIWorkoutPlan(plan: AIWorkoutPlan): void {
    try {
      const plans = this.getAIWorkoutPlans()
      const updatedPlans = [plan, ...plans]
      localStorage.setItem(STORAGE_KEYS.AI_WORKOUT_PLANS, JSON.stringify(updatedPlans))
    } catch (error) {
      console.error('Error saving AI workout plan:', error)
    }
  }

  static deleteAIWorkoutPlan(planId: string): void {
    try {
      const plans = this.getAIWorkoutPlans()
      const updatedPlans = plans.filter(plan => plan.id !== planId)
      localStorage.setItem(STORAGE_KEYS.AI_WORKOUT_PLANS, JSON.stringify(updatedPlans))
    } catch (error) {
      console.error('Error deleting AI workout plan:', error)
    }
  }

  // AI Meal Plans
  static getAIMealPlans(): AIMealPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AI_MEAL_PLANS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading AI meal plans:', error)
      return []
    }
  }

  static saveAIMealPlan(plan: AIMealPlan): void {
    try {
      const plans = this.getAIMealPlans()
      const updatedPlans = [plan, ...plans]
      localStorage.setItem(STORAGE_KEYS.AI_MEAL_PLANS, JSON.stringify(updatedPlans))
    } catch (error) {
      console.error('Error saving AI meal plan:', error)
    }
  }

  static deleteAIMealPlan(planId: string): void {
    try {
      const plans = this.getAIMealPlans()
      const updatedPlans = plans.filter(plan => plan.id !== planId)
      localStorage.setItem(STORAGE_KEYS.AI_MEAL_PLANS, JSON.stringify(updatedPlans))
    } catch (error) {
      console.error('Error deleting AI meal plan:', error)
    }
  }
}

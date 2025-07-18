import { AIWorkoutPlan, AIMealPlan, UserSettings, Message } from './types'

const STORAGE_KEYS = {
  USER_SETTINGS: 'userSettings',
  AI_WORKOUT_PLANS: 'aiWorkoutPlans',
  AI_MEAL_PLANS: 'aiMealPlans',
  WORKOUT_HISTORY: 'workoutHistory',
  DIET_HISTORY: 'dietHistory',
  CHAT_MESSAGES: 'chatMessages'
} as const

export class StorageManager {
  // User Settings
  static getUserSettings(): UserSettings | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error loading user settings:', error)
      return null
    }
  }

  static saveUserSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving user settings:', error)
    }
  }

  // Chat Messages
  static getChatMessages(): Message[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)
      const messages = data ? JSON.parse(data) : []
      return messages.map((message: any) => ({
        ...message,
        timestamp: new Date(message.timestamp)
      }))
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
      const plans = data ? JSON.parse(data) : []
      return plans.map((plan: any) => ({
        ...plan,
        date: new Date(plan.date)
      }))
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
      const plans = data ? JSON.parse(data) : []
      return plans.map((plan: any) => ({
        ...plan,
        date: new Date(plan.date)
      }))
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

  // Workout History
  static getWorkoutHistory(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY)
      const history = data ? JSON.parse(data) : []
      return history.map((workout: any) => ({
        ...workout,
        date: new Date(workout.date)
      }))
    } catch (error) {
      console.error('Error loading workout history:', error)
      return []
    }
  }

  static saveWorkoutHistory(history: any[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(history))
    } catch (error) {
      console.error('Error saving workout history:', error)
    }
  }

  // Diet History
  static getDietHistory(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DIET_HISTORY)
      const history = data ? JSON.parse(data) : []
      return history.map((log: any) => ({
        ...log,
        date: new Date(log.date)
      }))
    } catch (error) {
      console.error('Error loading diet history:', error)
      return []
    }
  }

  static saveDietHistory(history: any[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DIET_HISTORY, JSON.stringify(history))
    } catch (error) {
      console.error('Error saving diet history:', error)
    }
  }
} 
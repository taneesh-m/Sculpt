const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Workout endpoints
  async getWorkouts() {
    return this.request('/workouts')
  }

  async getWorkout(id: string) {
    return this.request(`/workouts/${id}`)
  }

  async createWorkout(data: {
    name: string
    type: 'strength' | 'cardio' | 'flexibility' | 'mixed'
    duration?: number
    notes?: string
  }) {
    return this.request('/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateWorkout(id: string, data: Partial<{
    name: string
    type: 'strength' | 'cardio' | 'flexibility' | 'mixed'
    duration: number
    notes: string
  }>) {
    return this.request(`/workouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteWorkout(id: string) {
    return this.request(`/workouts/${id}`, {
      method: 'DELETE',
    })
  }

  async addExercise(workoutId: string, data: {
    name: string
    sets?: number
    reps?: number
    weight?: number
    duration?: number
    notes?: string
  }) {
    return this.request(`/workouts/${workoutId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Diet endpoints
  async getDietLogs() {
    return this.request('/diet/logs')
  }

  async getDietLogsByDate(date: string) {
    return this.request(`/diet/logs/${date}`)
  }

  async createDietLog(data: {
    food_name: string
    calories: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    serving_size?: string
    notes?: string
  }) {
    return this.request('/diet/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDietLog(id: string, data: Partial<{
    food_name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    serving_size: string
    notes: string
  }>) {
    return this.request(`/diet/logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteDietLog(id: string) {
    return this.request(`/diet/logs/${id}`, {
      method: 'DELETE',
    })
  }

  async getNutritionGoals() {
    return this.request('/diet/goals')
  }

  async saveNutritionGoals(data: {
    daily_calories?: number
    daily_protein?: number
    daily_carbs?: number
    daily_fat?: number
    daily_fiber?: number
  }) {
    return this.request('/diet/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getNutritionSummary(startDate?: string, endDate?: string) {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    return this.request(`/diet/summary?${params.toString()}`)
  }

  // Chat endpoints
  async getChatHistory() {
    return this.request('/chat/history')
  }

  async sendMessage(message: string, conversationHistory?: any[]) {
    // Get user settings from localStorage
    const userSettings = localStorage.getItem('userSettings')
    const parsedSettings = userSettings ? JSON.parse(userSettings) : null

    const requestBody = { 
      message,
      userSettings: parsedSettings,
      conversationHistory: conversationHistory || []
    }

    console.log('Sending chat request:', requestBody)

    return this.request('/chat/send', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })
  }

  async clearChatHistory() {
    return this.request('/chat/history', {
      method: 'DELETE',
    })
  }

  async getChatStats() {
    return this.request('/chat/stats')
  }
}

export const api = new ApiClient(API_BASE_URL) 
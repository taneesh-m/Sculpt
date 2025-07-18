import { AIWorkoutPlan, AIMealPlan, Exercise, FoodItem } from './types'

export class AIParser {
  static parseWorkoutPlan(content: string): AIWorkoutPlan | null {
    try {
      console.log('Attempting to parse workout plan from content:', content.substring(0, 200) + '...')
      
      // Check if this looks like a workout plan
      const workoutKeywords = ['workout', 'exercise', 'routine', 'training', 'strength', 'cardio', 'push-ups', 'squats', 'bench press', 'deadlift']
      const hasWorkoutKeywords = workoutKeywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      )
      
      console.log('Has workout keywords:', hasWorkoutKeywords)
      
      if (!hasWorkoutKeywords) return null

      const lines = content.split('\n')
      let title = 'AI Generated Workout Plan'
      let description = ''
      let type = 'strength'
      let duration = 60
      let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
      let exercises: Exercise[] = []
      let currentSection = ''

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Extract title from first header
        if (line.startsWith('# ') && !title.includes('AI Generated')) {
          title = line.replace('# ', '')
        }
        
        // Extract description
        if (line.startsWith('## ') && line.toLowerCase().includes('description')) {
          currentSection = 'description'
          continue
        }
        
        if (currentSection === 'description' && line && !line.startsWith('#')) {
          description += line + ' '
        }
        
        // Look for exercise sections - be more flexible
        if (line.startsWith('### ') && (
          line.toLowerCase().includes('exercise') || 
          line.toLowerCase().includes('workout') ||
          line.toLowerCase().includes('routine') ||
          line.toLowerCase().includes('training')
        )) {
          currentSection = 'exercises'
          continue
        }
        
        // Parse exercises - handle multiple formats
        if (currentSection === 'exercises' && line.startsWith('- ')) {
          const exercise = this.parseExerciseLine(line)
          if (exercise) {
            exercises.push(exercise)
          }
        }
        
        // Also look for exercises in regular bullet points without section headers
        if (!currentSection && line.startsWith('- ') && (
          line.toLowerCase().includes('sets') || 
          line.toLowerCase().includes('reps') ||
          line.toLowerCase().includes('push-ups') ||
          line.toLowerCase().includes('squats') ||
          line.toLowerCase().includes('bench') ||
          line.toLowerCase().includes('deadlift')
        )) {
          const exercise = this.parseExerciseLine(line)
          if (exercise) {
            exercises.push(exercise)
          }
        }
        
        // Look for duration information
        if (line.toLowerCase().includes('duration') || line.toLowerCase().includes('minutes')) {
          const durationMatch = line.match(/(\d+)\s*(?:min|minutes?)/i)
          if (durationMatch) {
            duration = parseInt(durationMatch[1])
          }
        }
        
        // Look for difficulty
        if (line.toLowerCase().includes('beginner')) {
          difficulty = 'beginner'
        } else if (line.toLowerCase().includes('advanced')) {
          difficulty = 'advanced'
        }
        
        // Look for workout type
        if (line.toLowerCase().includes('strength')) {
          type = 'strength'
        } else if (line.toLowerCase().includes('cardio')) {
          type = 'cardio'
        } else if (line.toLowerCase().includes('flexibility')) {
          type = 'flexibility'
        }
      }

      console.log('Found exercises:', exercises.length)
      console.log('Exercises:', exercises)

      if (exercises.length === 0) {
        console.log('No exercises found, returning null')
        return null
      }

      const plan = {
        id: Date.now().toString(),
        title,
        description: description.trim() || 'AI generated workout plan',
        type,
        duration,
        exercises,
        date: new Date(),
        difficulty
      }

      console.log('Created workout plan:', plan)
      return plan
    } catch (error) {
      console.error('Error parsing workout plan:', error)
      return null
    }
  }

  static parseMealPlan(content: string): AIMealPlan | null {
    try {
      // Check if this looks like a meal plan
      const mealKeywords = ['meal', 'diet', 'nutrition', 'food', 'breakfast', 'lunch', 'dinner', 'snack']
      const hasMealKeywords = mealKeywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      )
      
      if (!hasMealKeywords) return null

      const lines = content.split('\n')
      let title = 'AI Generated Meal Plan'
      let description = ''
      let dailyCalories = 2000
      let meals: { name: string; foods: FoodItem[]; calories: number; protein: number; carbs: number; fat: number }[] = []
      let currentMeal = ''
      let currentFoods: FoodItem[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Extract title from first header
        if (line.startsWith('# ') && !title.includes('AI Generated')) {
          title = line.replace('# ', '')
        }
        
        // Look for daily calories
        if (line.toLowerCase().includes('calories') && line.includes(':')) {
          const caloriesMatch = line.match(/(\d+)/)
          if (caloriesMatch) {
            dailyCalories = parseInt(caloriesMatch[1])
          }
        }
        
        // Look for meal sections
        if (line.startsWith('### ') && (
          line.toLowerCase().includes('breakfast') ||
          line.toLowerCase().includes('lunch') ||
          line.toLowerCase().includes('dinner') ||
          line.toLowerCase().includes('snack')
        )) {
          // Save previous meal if exists
          if (currentMeal && currentFoods.length > 0) {
            const mealCalories = currentFoods.reduce((sum, food) => sum + food.calories, 0)
            const mealProtein = currentFoods.reduce((sum, food) => sum + food.protein, 0)
            const mealCarbs = currentFoods.reduce((sum, food) => sum + food.carbs, 0)
            const mealFat = currentFoods.reduce((sum, food) => sum + food.fat, 0)
            
            meals.push({
              name: currentMeal,
              foods: [...currentFoods],
              calories: mealCalories,
              protein: mealProtein,
              carbs: mealCarbs,
              fat: mealFat
            })
          }
          
          currentMeal = line.replace('### ', '')
          currentFoods = []
          continue
        }
        
        // Parse food items
        if (currentMeal && line.startsWith('- **') && line.includes('**:')) {
          const food = this.parseFoodLine(line, currentMeal)
          if (food) {
            currentFoods.push(food)
          }
        }
      }

      // Add the last meal
      if (currentMeal && currentFoods.length > 0) {
        const mealCalories = currentFoods.reduce((sum, food) => sum + food.calories, 0)
        const mealProtein = currentFoods.reduce((sum, food) => sum + food.protein, 0)
        const mealCarbs = currentFoods.reduce((sum, food) => sum + food.carbs, 0)
        const mealFat = currentFoods.reduce((sum, food) => sum + food.fat, 0)
        
        meals.push({
          name: currentMeal,
          foods: currentFoods,
          calories: mealCalories,
          protein: mealProtein,
          carbs: mealCarbs,
          fat: mealFat
        })
      }

      if (meals.length === 0) return null

      return {
        id: Date.now().toString(),
        title,
        description: description.trim() || 'AI generated meal plan',
        dailyCalories,
        meals,
        date: new Date()
      }
    } catch (error) {
      console.error('Error parsing meal plan:', error)
      return null
    }
  }

  private static parseExerciseLine(line: string): Exercise | null {
    try {
      console.log('Parsing exercise line:', line)
      
      // Handle format: "- **Exercise Name**: X sets of Y reps at Z weight"
      const match = line.match(/- \*\*(.*?)\*\*:?\s*(?:(\d+)\s*sets?\s*of\s*)?(\d+)\s*reps?(?:\s*at\s*(\d+)\s*(?:lbs?|kg))?/i)
      
      if (match) {
        const [, name, setsStr, repsStr, weightStr] = match
        const exercise = {
          id: Date.now().toString() + Math.random(),
          name: name.trim(),
          sets: setsStr ? parseInt(setsStr) : 3,
          reps: parseInt(repsStr),
          weight: weightStr ? parseFloat(weightStr) : undefined
        }
        console.log('Parsed exercise (format 1):', exercise)
        return exercise
      }
      
      // Handle format: "- Exercise Name: X sets, Y reps"
      const simpleMatch = line.match(/- (.*?):\s*(\d+)\s*sets?,?\s*(\d+)\s*reps?/i)
      
      if (simpleMatch) {
        const [, name, setsStr, repsStr] = simpleMatch
        const exercise = {
          id: Date.now().toString() + Math.random(),
          name: name.trim(),
          sets: parseInt(setsStr),
          reps: parseInt(repsStr)
        }
        console.log('Parsed exercise (format 2):', exercise)
        return exercise
      }
      
      // Handle format: "- X sets of Y reps of Exercise Name"
      const reverseMatch = line.match(/- (\d+)\s*sets?\s*of\s*(\d+)\s*reps?\s*of\s*(.*)/i)
      
      if (reverseMatch) {
        const [, setsStr, repsStr, name] = reverseMatch
        const exercise = {
          id: Date.now().toString() + Math.random(),
          name: name.trim(),
          sets: parseInt(setsStr),
          reps: parseInt(repsStr)
        }
        console.log('Parsed exercise (format 3):', exercise)
        return exercise
      }
      
      // Handle format: "- Exercise Name - X sets x Y reps"
      const dashMatch = line.match(/- (.*?)\s*-\s*(\d+)\s*sets?\s*x\s*(\d+)\s*reps?/i)
      
      if (dashMatch) {
        const [, name, setsStr, repsStr] = dashMatch
        const exercise = {
          id: Date.now().toString() + Math.random(),
          name: name.trim(),
          sets: parseInt(setsStr),
          reps: parseInt(repsStr)
        }
        console.log('Parsed exercise (format 4):', exercise)
        return exercise
      }
      
      console.log('No exercise pattern matched for line:', line)
      return null
    } catch (error) {
      console.error('Error parsing exercise line:', error)
      return null
    }
  }

  private static parseFoodLine(line: string, mealType: string): FoodItem | null {
    try {
      // Handle format: "- **Food Name**: description with nutrition info"
      const match = line.match(/- \*\*(.*?)\*\*:?\s*(.*)/)
      
      if (match) {
        const [, name, description] = match
        
        // Try to extract nutrition info from description
        const caloriesMatch = description.match(/(\d+)\s*calories?/i)
        const proteinMatch = description.match(/(\d+(?:\.\d+)?)g?\s*protein/i)
        const carbsMatch = description.match(/(\d+(?:\.\d+)?)g?\s*carbs?/i)
        const fatMatch = description.match(/(\d+(?:\.\d+)?)g?\s*fat/i)
        
        return {
          id: Date.now().toString() + Math.random(),
          name: name.trim(),
          quantity: 100,
          unit: 'g',
          calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 0,
          protein: proteinMatch ? parseFloat(proteinMatch[1]) : 0,
          carbs: carbsMatch ? parseFloat(carbsMatch[1]) : 0,
          fat: fatMatch ? parseFloat(fatMatch[1]) : 0,
          mealType: mealType.toLowerCase()
        }
      }
      
      return null
    } catch (error) {
      console.error('Error parsing food line:', error)
      return null
    }
  }
} 
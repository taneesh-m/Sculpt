"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, X, Search, Utensils, Flame } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AIMealPlans } from "@/components/ai-meal-plans"
import { useCreateDietLogs, useDietLogs } from "@/lib/hooks/use-diet"
import { FoodItem } from "@/lib/types"

// Local food reference for quick-add -- USDA lookup replaces this in the
// tool-calling agent rewrite.
const foodDatabase = [
  { name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: "100g" },
  { name: "Brown Rice", calories: 112, protein: 2.6, carbs: 23.5, fat: 0.9, unit: "100g" },
  { name: "Broccoli", calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, unit: "100g" },
  { name: "Salmon", calories: 206, protein: 22.1, carbs: 0, fat: 13.4, unit: "100g" },
  { name: "Sweet Potato", calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, unit: "100g" },
  { name: "Greek Yogurt", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, unit: "100g" },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, unit: "100g" },
  { name: "Almonds", calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9, unit: "100g" },
]

export function DietInput() {
  const { toast } = useToast()
  const { data: recentLogs = [] } = useDietLogs()
  const createDietLogs = useCreateDietLogs()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFood, setSelectedFood] = useState<(typeof foodDatabase)[0] | null>(null)
  const [quantity, setQuantity] = useState(100)
  const [mealType, setMealType] = useState<FoodItem["mealType"] | "">("")
  const [todaysFoods, setTodaysFoods] = useState<FoodItem[]>([])

  const filteredFoods = foodDatabase.filter((food) => food.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const addFood = () => {
    if (!selectedFood || !mealType) {
      toast({
        title: "Error",
        description: "Please select a food item and meal type",
        variant: "destructive",
      })
      return
    }

    const multiplier = quantity / 100 // Convert to per 100g basis
    const foodItem: FoodItem = {
      id: Date.now().toString(),
      name: selectedFood.name,
      quantity,
      unit: "g",
      calories: Math.round(selectedFood.calories * multiplier),
      protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
      fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
      mealType,
    }

    setTodaysFoods((prev) => [...prev, foodItem])
    setSelectedFood(null)
    setSearchTerm("")
    setQuantity(100)
    setMealType("")

    toast({
      title: "Food Added",
      description: `${foodItem.name} has been added to your ${foodItem.mealType}`,
    })
  }

  const removeFood = (foodId: string) => {
    setTodaysFoods((prev) => prev.filter((food) => food.id !== foodId))
  }

  const saveDailyLog = () => {
    if (todaysFoods.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one food item",
        variant: "destructive",
      })
      return
    }

    createDietLogs.mutate(
      todaysFoods.map((food) => ({
        food_name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        meal_type: food.mealType,
        serving_size: `${food.quantity}${food.unit}`,
      })),
      {
        onSuccess: () => {
          setTodaysFoods([])
          toast({
            title: "Daily Log Saved!",
            description: "Your nutrition intake has been logged successfully",
          })
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to save your nutrition log. Please try again.",
            variant: "destructive",
          })
        },
      },
    )
  }

  const getTotalNutrition = () => {
    return todaysFoods.reduce(
      (totals, food) => ({
        calories: totals.calories + food.calories,
        protein: totals.protein + food.protein,
        carbs: totals.carbs + food.carbs,
        fat: totals.fat + food.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }

  const groupFoodsByMeal = () => {
    return todaysFoods.reduce(
      (groups, food) => {
        const meal = food.mealType
        if (!groups[meal]) groups[meal] = []
        groups[meal].push(food)
        return groups
      },
      {} as Record<string, FoodItem[]>,
    )
  }

  const totals = getTotalNutrition()
  const mealGroups = groupFoodsByMeal()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Utensils className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Nutrition Tracking</h2>
      </div>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="log">Log Nutrition</TabsTrigger>
          <TabsTrigger value="ai-plans">AI Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-6">
          {/* Food Search and Add */}
          <Card>
            <CardHeader>
              <CardTitle>Add Food</CardTitle>
              <CardDescription>Search and add foods to track your nutrition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="food-search">Search Food</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="food-search"
                    placeholder="Search for foods..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {searchTerm && (
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {filteredFoods.map((food, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-3 hover:bg-muted border-b last:border-b-0"
                      onClick={() => {
                        setSelectedFood(food)
                        setSearchTerm(food.name)
                      }}
                    >
                      <div className="font-medium">{food.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {food.calories} cal, {food.protein}g protein per {food.unit}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedFood && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity (grams)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 100)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meal-type">Meal Type</Label>
                    <Select value={mealType} onValueChange={(value) => setMealType(value as FoodItem["mealType"])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addFood} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Food
                    </Button>
                  </div>
                </div>
              )}

              {selectedFood && (
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Nutrition Preview ({quantity}g)</h4>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Calories:</span>
                      <br />
                      <span className="font-medium">{Math.round((selectedFood.calories * quantity) / 100)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Protein:</span>
                      <br />
                      <span className="font-medium">{Math.round((selectedFood.protein * quantity) / 100 * 10) / 10}g</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Carbs:</span>
                      <br />
                      <span className="font-medium">{Math.round((selectedFood.carbs * quantity) / 100 * 10) / 10}g</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fat:</span>
                      <br />
                      <span className="font-medium">{Math.round((selectedFood.fat * quantity) / 100 * 10) / 10}g</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Food Log */}
          {todaysFoods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s Food Log</CardTitle>
                <CardDescription>
                  {todaysFoods.length} food item{todaysFoods.length !== 1 ? "s" : ""} logged today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nutrition Summary */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-3">Daily Totals</h4>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Calories:</span>
                      <br />
                      <span className="font-medium text-lg">{totals.calories}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Protein:</span>
                      <br />
                      <span className="font-medium text-lg">{Math.round(totals.protein * 10) / 10}g</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Carbs:</span>
                      <br />
                      <span className="font-medium text-lg">{Math.round(totals.carbs * 10) / 10}g</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fat:</span>
                      <br />
                      <span className="font-medium text-lg">{Math.round(totals.fat * 10) / 10}g</span>
                    </div>
                  </div>
                </div>

                {/* Foods by Meal */}
                {Object.entries(mealGroups).map(([meal, foods]) => (
                  <div key={meal} className="space-y-2">
                    <h4 className="font-medium capitalize">{meal}</h4>
                    <div className="space-y-2">
                      {foods.map((food) => (
                        <div key={food.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{food.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {food.quantity}g • {food.calories} cal • {food.protein}g protein
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFood(food.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <Button onClick={saveDailyLog} className="w-full" disabled={createDietLogs.isPending}>
                  <Flame className="h-4 w-4 mr-2" />
                  {createDietLogs.isPending ? "Saving..." : "Save Daily Log"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Diet History */}
          {recentLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Nutrition Logs</CardTitle>
                <CardDescription>Your logged nutrition history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium capitalize">
                            {log.food_name} • {log.meal_type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {log.calories} cal
                            {log.protein !== undefined && ` • ${log.protein}g protein`}
                            {log.carbs !== undefined && ` • ${log.carbs}g carbs`}
                            {log.fat !== undefined && ` • ${log.fat}g fat`}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-plans">
          <AIMealPlans />
        </TabsContent>
      </Tabs>
    </div>
  )
}

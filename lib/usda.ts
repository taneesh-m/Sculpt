// USDA FoodData Central client. Free API key at
// https://fdc.nal.usda.gov/api-key-signup. Replaces the old hardcoded
// 4-item mock dictionary (app/api/agent/diet.ts, deleted in phase 0) which
// silently fell back to "chicken breast" data for any unrecognized food.

export type NutritionResult = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize: string
}

type UsdaNutrient = {
  nutrientName: string
  value: number
  unitName: string
}

type UsdaFood = {
  description: string
  foodNutrients: UsdaNutrient[]
  servingSize?: number
  servingSizeUnit?: string
}

function findNutrient(nutrients: UsdaNutrient[], name: string): number {
  const match = nutrients.find((n) => n.nutrientName.toLowerCase().includes(name.toLowerCase()))
  return match ? Math.round(match.value * 10) / 10 : 0
}

export async function searchUsdaFoods(query: string, limit = 5): Promise<NutritionResult[]> {
  const apiKey = process.env.USDA_API_KEY
  if (!apiKey) {
    throw new Error("USDA_API_KEY is not configured")
  }

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search")
  url.searchParams.set("query", query)
  url.searchParams.set("pageSize", String(limit))
  url.searchParams.set("api_key", apiKey)

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`USDA API request failed: ${response.status}`)
  }

  const data: { foods?: UsdaFood[] } = await response.json()
  if (!data.foods || data.foods.length === 0) {
    return []
  }

  return data.foods.slice(0, limit).map((food) => ({
    name: food.description,
    calories: findNutrient(food.foodNutrients, "energy"),
    protein: findNutrient(food.foodNutrients, "protein"),
    carbs: findNutrient(food.foodNutrients, "carbohydrate"),
    fat: findNutrient(food.foodNutrients, "total lipid"),
    servingSize: food.servingSize ? `${food.servingSize}${food.servingSizeUnit ?? "g"}` : "100g",
  }))
}

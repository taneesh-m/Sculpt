import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { DietLogRecord } from "@/lib/types"

export type FoodSearchResult = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize: string
}

async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const res = await fetch(`/api/diet/search?query=${encodeURIComponent(query)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Food search failed")
  }
  const { foods } = await res.json()
  return foods
}

// Debounced USDA food search. `query` should already be debounced by the
// caller; the query is disabled below a 2-char threshold to avoid firing a
// USDA request on every keystroke.
export function useFoodSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: ["food-search", trimmed],
    queryFn: () => searchFoods(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 5 * 60 * 1000,
  })
}

async function fetchDietLogs(date?: string): Promise<DietLogRecord[]> {
  const url = date ? `/api/diet/logs?date=${date}` : "/api/diet/logs"
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch diet logs")
  const { dietLogs } = await res.json()
  return dietLogs
}

type CreateDietLogInput = Omit<DietLogRecord, "id" | "created_at">

async function createDietLogs(entries: CreateDietLogInput[]): Promise<DietLogRecord[]> {
  const res = await fetch("/api/diet/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entries),
  })
  if (!res.ok) throw new Error("Failed to create diet log")
  const { dietLogs } = await res.json()
  return dietLogs
}

export function useDietLogs(date?: string) {
  return useQuery({ queryKey: ["diet-logs", date ?? "all"], queryFn: () => fetchDietLogs(date) })
}

export function useCreateDietLogs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDietLogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet-logs"] })
    },
  })
}

import { useQuery } from "@tanstack/react-query"

export type AnalyticsDay = { day: string; calories: number; workouts: number }

async function fetchAnalyticsSummary(): Promise<AnalyticsDay[]> {
  const res = await fetch("/api/analytics/summary")
  if (!res.ok) throw new Error("Failed to fetch analytics summary")
  const { series } = await res.json()
  return series
}

export function useAnalyticsSummary() {
  return useQuery({ queryKey: ["analytics-summary"], queryFn: fetchAnalyticsSummary })
}

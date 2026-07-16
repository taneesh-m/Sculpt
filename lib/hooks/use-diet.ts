import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { DietLogRecord } from "@/lib/types"

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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UIMessage } from "ai"

type ChatHistoryRow = {
  id: string
  user_message: string
  ai_response: string
  created_at: string
}

// chat_history stores one row per exchange (user_message + ai_response);
// useChat's UIMessage model is a flat list of individual messages, so each
// row expands into two.
function rowsToMessages(rows: ChatHistoryRow[]): UIMessage[] {
  return rows.flatMap((row) => [
    { id: `${row.id}-user`, role: "user" as const, parts: [{ type: "text" as const, text: row.user_message }] },
    { id: `${row.id}-assistant`, role: "assistant" as const, parts: [{ type: "text" as const, text: row.ai_response }] },
  ])
}

async function fetchChatHistory(): Promise<UIMessage[]> {
  const res = await fetch("/api/chat/history")
  if (!res.ok) throw new Error("Failed to fetch chat history")
  const { chatHistory } = await res.json()
  return rowsToMessages(chatHistory)
}

async function clearChatHistory(): Promise<void> {
  const res = await fetch("/api/chat/history", { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to clear chat history")
}

export function useChatHistory() {
  return useQuery({ queryKey: ["chat-history"], queryFn: fetchChatHistory })
}

export function useClearChatHistory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: clearChatHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-history"] })
    },
  })
}

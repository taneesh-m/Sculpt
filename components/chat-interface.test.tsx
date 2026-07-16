import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import type { UIMessage } from "ai"

const sendMessageMock = vi.fn()

// A stand-in for @ai-sdk/react's useChat that behaves like the real hook
// closely enough to test the component's own logic: sendMessage appends a
// user message and (synchronously, for the test) an assistant reply.
vi.mock("@ai-sdk/react", () => ({
  useChat: ({ messages: initialMessages }: { messages: UIMessage[] }) => {
    const [messages, setMessages] = useState(initialMessages)
    return {
      messages,
      status: "ready" as const,
      setMessages,
      sendMessage: (msg: { text: string }) => {
        sendMessageMock(msg)
        setMessages((prev) => [
          ...prev,
          { id: `user-${prev.length}`, role: "user", parts: [{ type: "text", text: msg.text }] },
          { id: `assistant-${prev.length}`, role: "assistant", parts: [{ type: "text", text: "Mock reply" }] },
        ])
      },
    }
  },
}))

vi.mock("@/lib/hooks/use-chat-history", () => ({
  useChatHistory: () => ({ data: [], isLoading: false }),
  useClearChatHistory: () => ({ mutate: vi.fn() }),
}))

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

import { ChatInterface } from "./chat-interface"

describe("ChatInterface", () => {
  it("renders the welcome message when there is no chat history", async () => {
    render(<ChatInterface />)
    expect(await screen.findByText(/fitness and nutrition assistant/i)).toBeInTheDocument()
  })

  it("sends a message and displays it in the message list", async () => {
    const user = userEvent.setup()
    render(<ChatInterface />)

    const input = await screen.findByPlaceholderText("Ask about workouts or nutrition...")
    await user.type(input, "What should I eat before a workout?")
    await user.click(screen.getByRole("button", { name: "" })) // send icon button has no accessible name

    expect(sendMessageMock).toHaveBeenCalledWith({ text: "What should I eat before a workout?" })
    expect(await screen.findByText("What should I eat before a workout?")).toBeInTheDocument()
    expect(await screen.findByText("Mock reply")).toBeInTheDocument()
  })
})

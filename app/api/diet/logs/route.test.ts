import { describe, expect, it, vi, beforeEach } from "vitest"

// A minimal chainable mock of the Supabase query builder: every method
// returns `this`, and the object is thenable so `await query` resolves to
// the configured { data, error } -- matching supabase-js's own shape.
function createQueryBuilderMock(result: { data: unknown; error: unknown }) {
  const builder: any = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lt: vi.fn(() => builder),
    order: vi.fn(() => builder),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  }
  return builder
}

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}))

import { GET, POST } from "./route"

describe("GET /api/diet/logs", () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
  })

  it("returns 401 when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const response = await GET(new Request("http://localhost/api/diet/logs"))

    expect(response.status).toBe(401)
  })

  it("scopes the query to the authenticated user's id", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } })
    const builder = createQueryBuilderMock({ data: [{ id: "log-1", food_name: "Banana" }], error: null })
    mockFrom.mockReturnValue(builder)

    const response = await GET(new Request("http://localhost/api/diet/logs"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith("diet_logs")
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-123")
    expect(body.dietLogs).toEqual([{ id: "log-1", food_name: "Banana" }])
  })
})

describe("POST /api/diet/logs", () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
  })

  it("returns 401 when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const response = await POST(
      new Request("http://localhost/api/diet/logs", {
        method: "POST",
        body: JSON.stringify({ food_name: "Apple", calories: 95, meal_type: "snack" }),
      }),
    )

    expect(response.status).toBe(401)
  })

  it("rejects an entry missing required fields", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } })

    const response = await POST(
      new Request("http://localhost/api/diet/logs", {
        method: "POST",
        body: JSON.stringify({ food_name: "Apple" }), // missing calories, meal_type
      }),
    )

    expect(response.status).toBe(400)
  })

  it("inserts entries tagged with the authenticated user's id", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } })
    const builder = createQueryBuilderMock({ data: [{ id: "log-1", food_name: "Apple", user_id: "user-123" }], error: null })
    mockFrom.mockReturnValue(builder)

    const response = await POST(
      new Request("http://localhost/api/diet/logs", {
        method: "POST",
        body: JSON.stringify({ food_name: "Apple", calories: 95, meal_type: "snack" }),
      }),
    )

    expect(response.status).toBe(201)
    expect(builder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ food_name: "Apple", calories: 95, meal_type: "snack", user_id: "user-123" }),
    ])
  })
})

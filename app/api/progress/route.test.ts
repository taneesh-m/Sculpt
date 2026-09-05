import { describe, expect, it, vi, beforeEach } from "vitest"

// Same chainable/thenable Supabase query-builder mock used by the diet logs
// route test: every method returns `this`, and awaiting the builder resolves
// to the configured { data, error }.
function createQueryBuilderMock(result: { data: unknown; error: unknown }) {
  const builder: any = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    single: vi.fn(() => builder),
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

describe("GET /api/progress", () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
  })

  it("returns 401 when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const response = await GET(new Request("http://localhost/api/progress"))

    expect(response.status).toBe(401)
  })

  it("scopes the query to the authenticated user's id", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } })
    const builder = createQueryBuilderMock({ data: [{ id: "entry-1", weight: 80 }], error: null })
    mockFrom.mockReturnValue(builder)

    const response = await GET(new Request("http://localhost/api/progress"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith("progress_tracking")
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-123")
    expect(body.entries).toEqual([{ id: "entry-1", weight: 80 }])
  })

  it("applies ?limit when it is a positive integer", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } })
    const builder = createQueryBuilderMock({ data: [], error: null })
    mockFrom.mockReturnValue(builder)

    await GET(new Request("http://localhost/api/progress?limit=5"))

    expect(builder.limit).toHaveBeenCalledWith(5)
  })

  it("ignores a non-numeric ?limit rather than erroring", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } })
    const builder = createQueryBuilderMock({ data: [], error: null })
    mockFrom.mockReturnValue(builder)

    const response = await GET(new Request("http://localhost/api/progress?limit=abc"))

    expect(response.status).toBe(200)
    expect(builder.limit).not.toHaveBeenCalled()
  })
})

describe("POST /api/progress", () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
  })

  it("returns 401 when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const response = await POST(
      new Request("http://localhost/api/progress", { method: "POST", body: JSON.stringify({ weight: 80 }) }),
    )

    expect(response.status).toBe(401)
  })

  it("rejects an entry with notes but no measurement", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } })

    const response = await POST(
      new Request("http://localhost/api/progress", {
        method: "POST",
        body: JSON.stringify({ progress_notes: "felt strong today" }),
      }),
    )

    expect(response.status).toBe(400)
  })

  it("rejects an entry whose only measurement is an empty measurements object", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } })

    const response = await POST(
      new Request("http://localhost/api/progress", { method: "POST", body: JSON.stringify({ measurements: {} }) }),
    )

    expect(response.status).toBe(400)
  })

  it("accepts an entry whose only measurement is body fat", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } })
    const builder = createQueryBuilderMock({ data: { id: "entry-1", body_fat_percentage: 18 }, error: null })
    mockFrom.mockReturnValue(builder)

    const response = await POST(
      new Request("http://localhost/api/progress", {
        method: "POST",
        body: JSON.stringify({ body_fat_percentage: 18 }),
      }),
    )

    expect(response.status).toBe(201)
  })

  it("inserts the entry tagged with the authenticated user's id", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } })
    const builder = createQueryBuilderMock({ data: { id: "entry-1", weight: 80, user_id: "user-123" }, error: null })
    mockFrom.mockReturnValue(builder)

    const response = await POST(
      new Request("http://localhost/api/progress", {
        method: "POST",
        body: JSON.stringify({ weight: 80, progress_notes: "down 1kg" }),
      }),
    )

    expect(response.status).toBe(201)
    expect(builder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ weight: 80, progress_notes: "down 1kg", user_id: "user-123" }),
    ])
  })
})

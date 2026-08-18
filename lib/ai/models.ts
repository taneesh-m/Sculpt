// Model IDs live here so the live chat route and the eval harness can't drift
// apart -- the eval is only meaningful if it generates with the same model the
// app actually serves.

// Chat coach + the eval's generation step.
export const CHAT_MODEL = "gpt-5.5"

// The eval's scoring step. Kept separate so the judge can be pinned or swapped
// independently of the model under test.
export const JUDGE_MODEL = "gpt-5.5"

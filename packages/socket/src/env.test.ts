import { afterEach, describe, expect, it, vi } from "vitest"

const loadEnv = async () => {
  vi.resetModules()

  return await import("@razzia/socket/env")
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("PUBLIC_URL", () => {
  it("is undefined when unset", async () => {
    vi.stubEnv("PUBLIC_URL", "")

    const { publicUrl } = await loadEnv()

    expect(publicUrl).toBeUndefined()
  })

  it("accepts an http URL", async () => {
    vi.stubEnv("PUBLIC_URL", "https://quiz.example.com")

    const { publicUrl } = await loadEnv()

    expect(publicUrl).toBe("https://quiz.example.com")
  })

  it("rejects a value that is not a URL", async () => {
    vi.stubEnv("PUBLIC_URL", "quiz.example.com")

    await expect(loadEnv()).rejects.toThrow(/PUBLIC_URL/)
  })
})

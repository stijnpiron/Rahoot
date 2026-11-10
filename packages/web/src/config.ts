import { z } from "zod"

let current: { publicUrl: string | null } = { publicUrl: null }

export const getPublicUrl = (): string | null => current.publicUrl

export const loadPublicConfig = async (): Promise<void> => {
  try {
    const response = await fetch("/api/config", {
      cache: "no-cache",
      signal: AbortSignal.timeout(2000),
    })

    if (!response.ok) {
      return
    }

    const parsed = z
      .object({ publicUrl: z.url().nullable() })
      .safeParse(await response.json())

    if (parsed.success) {
      current = parsed.data
    }
  } catch {
    // Fall back to window.location.origin
  }
}

import { describe, expect, it } from "vitest"
import { shuffleIndices } from "@razzia/socket/utils/shuffle"

describe("shuffleIndices", () => {
  it("returns a permutation of the original indices", () => {
    for (let length = 0; length <= 8; length += 1) {
      const shuffled = shuffleIndices(length)

      expect(shuffled).toHaveLength(length)
      expect([...shuffled].sort((a, b) => a - b)).toEqual(
        Array.from({ length }, (_, index) => index),
      )
    }
  })
})

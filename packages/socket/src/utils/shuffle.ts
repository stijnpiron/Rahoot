/**
 * Fisher–Yates shuffle of `[0, n)` indices. Used to shuffle puzzle tiles once
 * per game-question so every broadcast shows the same order.
 */
export const shuffleIndices = (length: number): number[] => {
  const indices = Array.from({ length }, (_, index) => index)

  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = indices[i]

    indices[i] = indices[j]
    indices[j] = swap
  }

  return indices
}

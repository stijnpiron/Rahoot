import { QUESTION_TYPES } from "@razzia/common/constants"
import type { Answer, Question } from "@razzia/common/types/game"
import type { ScoringFn } from "@razzia/socket/services/scoring"

export const type = QUESTION_TYPES.PUZZLE

/**
 * `answerIds` are the original tile indices in the order the player arranged
 * them. The stored `answers` order is the solution, so tile `i` belongs at
 * position `i`.
 */
export const scoring: ScoringFn = (question, answer): number => {
  const { answerIds } = answer
  const total = question.answers.length

  if (total === 0 || answerIds.length !== total) {
    return 0
  }

  const correctlyPlaced = answerIds.filter((id, index) => id === index).length

  return correctlyPlaced / total
}

export const countFullyCorrect = (
  question: Question,
  answers: Answer[],
): number =>
  answers.filter(
    (answer) =>
      scoring(question, answer) === 1 &&
      answer.answerIds.length === question.answers.length,
  ).length

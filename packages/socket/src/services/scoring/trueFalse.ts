import { QUESTION_TYPES } from "@razzia/common/constants"

import type { ScoringFn } from "@razzia/socket/services/scoring"

export const type = QUESTION_TYPES.TRUE_FALSE

export const scoring: ScoringFn = (question, answer): number => {
  const { answerIds } = answer

  if (answerIds.length !== 1) {
    return 0
  }

  if (!question.solutions?.includes(answerIds[0])) {
    return 0
  }

  return 1
}

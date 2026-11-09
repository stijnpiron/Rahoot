import { QUESTION_TYPES } from "@razzia/common/constants"
import { pinAccuracy } from "@razzia/common/questions/pin"
import { isPinOptions } from "@razzia/common/questions/options"
import type { ScoringFn } from "@razzia/socket/services/scoring"

export const type = QUESTION_TYPES.PIN

export const scoring: ScoringFn = (question, answer): number => {
  if (!answer.pin || !isPinOptions(question.options)) {
    return 0
  }

  const { area } = question.options

  if (!area) {
    return 0
  }

  return pinAccuracy(answer.pin, area)
}

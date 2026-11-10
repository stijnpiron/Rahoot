import type {
  DoQuestionOptions,
  EstimationQuestionOptions,
  MultiQuestionOptions,
  PinQuestionOptions,
  QuestionOptions,
} from "@razzia/common/types/game"

export const isMultiOptions = (
  options?: QuestionOptions,
): options is MultiQuestionOptions =>
  options !== undefined && "scoringMode" in options

export const isEstimationOptions = (
  options?: QuestionOptions,
): options is EstimationQuestionOptions =>
  options !== undefined && "min" in options && "max" in options

export const isPinOptions = (
  options?: QuestionOptions,
): options is PinQuestionOptions =>
  options !== undefined && "area" in options

export const isDoOptions = (
  options?: QuestionOptions,
): options is DoQuestionOptions =>
  options !== undefined &&
  ("flow" in options ||
    "doneButton" in options ||
    "timerExpiry" in options)

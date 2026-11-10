import { MIN_ANSWERS, QUESTION_TYPES } from "@razzia/common/constants"
import { estimationAccuracy } from "@razzia/common/questions/estimation"
import {
  isEstimationOptions,
  isPinOptions,
} from "@razzia/common/questions/options"
import { pinAccuracy } from "@razzia/common/questions/pin"
import type { PinPoint, Question } from "@razzia/common/types/game"

export const choiceInitialValues = (question: Question): Partial<Question> => {
  if (question.answers.length >= MIN_ANSWERS) {
    return {}
  }

  return { answers: ["", ""], solutions: [0] }
}

export const isAnswerCorrect = (
  question: Question,
  answer: { answerIds: number[] | null; pin?: PinPoint | null },
): boolean => {
  const { solutions, options } = question

  if (question.type === QUESTION_TYPES.PIN) {
    if (!isPinOptions(options) || !options.area || !answer.pin) {
      return false
    }

    return pinAccuracy(answer.pin, options.area) > 0
  }

  if (!answer.answerIds || !solutions) {
    return false
  }

  const { answerIds } = answer

  if (isEstimationOptions(options)) {
    const value = answerIds.at(0)
    const solution = solutions.at(0)

    return (
      value !== undefined &&
      solution !== undefined &&
      estimationAccuracy(value, solution, options.margin) > 0
    )
  }

  if (question.type === QUESTION_TYPES.PUZZLE) {
    return (
      answerIds.length === question.answers.length &&
      answerIds.every((id, index) => id === index)
    )
  }

  return answerIds.some((id) => solutions.includes(id))
}

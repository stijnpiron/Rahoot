import { QUESTION_TYPES } from "@razzia/common/constants"
import type { Question, QuestionType } from "@razzia/common/types/game"
import { refineChoiceQuestion } from "@razzia/common/validators/questions/choice"
import { refineEstimationQuestion } from "@razzia/common/validators/questions/estimation"
import { refinePinQuestion } from "@razzia/common/validators/questions/pin"
import { refinePuzzleQuestion } from "@razzia/common/validators/questions/puzzle"
import { refineTrueFalseQuestion } from "@razzia/common/validators/questions/trueFalse"

export type AddIssue = (_path: Array<string | number>, _message: string) => void

export type QuestionRefinement = (
  _question: Question,
  _addIssue: AddIssue,
) => void

export type RefinableQuestionType = Exclude<QuestionType, "slide">

export const QUESTION_REFINEMENTS: Record<
  RefinableQuestionType,
  QuestionRefinement
> = {
  [QUESTION_TYPES.SINGLE]: refineChoiceQuestion,
  [QUESTION_TYPES.MULTI]: refineChoiceQuestion,
  [QUESTION_TYPES.ESTIMATION]: refineEstimationQuestion,
  [QUESTION_TYPES.TRUE_FALSE]: refineTrueFalseQuestion,
  [QUESTION_TYPES.PUZZLE]: refinePuzzleQuestion,
  [QUESTION_TYPES.PIN]: refinePinQuestion,
}

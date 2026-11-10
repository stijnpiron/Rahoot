import {
  PUZZLE_MAX_ANSWERS,
  PUZZLE_MIN_ANSWERS,
} from "@razzia/common/constants"
import type { QuestionRefinement } from "@razzia/common/validators/questions"

export const refinePuzzleQuestion: QuestionRefinement = (
  { answers },
  addIssue,
) => {
  if (
    answers.length < PUZZLE_MIN_ANSWERS ||
    answers.length > PUZZLE_MAX_ANSWERS
  ) {
    addIssue(["answers"], "errors:quizz.puzzleInvalidAnswers")
  }
}

import type { QuestionRefinement } from "@razzia/common/validators/questions"

export const refineTrueFalseQuestion: QuestionRefinement = (
  { answers, solutions },
  addIssue,
) => {
  if (answers.length !== 2) {
    addIssue(["answers"], "errors:quizz.trueFalseInvalidAnswers")
  }

  const solution = solutions?.at(0)

  if (
    solutions !== undefined &&
    solutions.length > 0 &&
    (solutions.length !== 1 || (solution !== 0 && solution !== 1))
  ) {
    addIssue(["solutions"], "errors:quizz.trueFalseInvalidSolution")
  }
}

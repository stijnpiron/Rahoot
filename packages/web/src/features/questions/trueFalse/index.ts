import type { Question } from "@razzia/common/types/game"

export { default as AnswerComponent } from "@razzia/web/features/questions/trueFalse/components/TrueFalseAnswers"

export { default as ConfigComponent } from "@razzia/web/features/questions/trueFalse/components/TrueFalseConfig"

export { default as AnswersEditor } from "@razzia/web/features/questions/trueFalse/components/TrueFalseEditor"

export { default as PreparedComponent } from "@razzia/web/features/questions/trueFalse/components/TrueFalsePrepared"

export const labelKey = "quizz:questionType.trueFalse"

export const initialValues = (): Partial<Question> => ({
  answers: ["true", "false"],
  solutions: [0],
})

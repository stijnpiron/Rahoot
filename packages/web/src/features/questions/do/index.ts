import type { Question } from "@razzia/common/types/game"

export { default as AnswerComponent } from "@razzia/web/features/questions/do/components/DoAnswers"

export { default as ConfigComponent } from "@razzia/web/features/questions/do/components/DoConfig"

export { default as AnswersEditor } from "@razzia/web/features/questions/do/components/DoEditor"

export { default as PreparedComponent } from "@razzia/web/features/questions/do/components/DoPrepared"

export { default as ResponsesComponent } from "@razzia/web/features/questions/do/components/DoResponses"

export const labelKey = "quizz:questionType.do"

export const initialValues = (): Partial<Question> => ({
  answers: [],
})

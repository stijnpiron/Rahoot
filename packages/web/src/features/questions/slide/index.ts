import type { Question } from "@razzia/common/types/game"

export const slideInitialValues = (_question: Question): Partial<Question> => ({
  title: "",
  answers: [],
  solutions: undefined,
  options: undefined,
  cooldown: 3,
  time: -1,
})

export const labelKey = "quizz:questionType.slide"

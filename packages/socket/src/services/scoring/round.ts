import type { Answer, Player, Question } from "@razzia/common/types/game"
import { QUESTION_TYPES } from "@razzia/common/constants"
import { QUESTION_SCORING } from "@razzia/socket/services/scoring"

export type ScoredPlayer = Player & {
  lastCorrect: boolean
  lastPoints: number
}

export const countAnswers = (answers: Answer[]): Record<number, number> => {
  const answerIds = answers.flatMap((answer) => answer.answerIds)

  return answerIds.reduce<Record<number, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1

    return acc
  }, {})
}

export const scoreQuestion = (
  question: Question,
  players: Player[],
  answers: Answer[],
): ScoredPlayer[] => {
  const scored = players.map((player) => {
    const playerAnswer = answers.find((a) => a.playerId === player.id)

    const scoreMultiplier = (() => {
      if (!playerAnswer) {
        return 0
      }

      const scoring =
        QUESTION_SCORING[question.type as keyof typeof QUESTION_SCORING]

      return scoring(question, playerAnswer)
    })()

    const points = (playerAnswer?.points ?? 0) * scoreMultiplier
    const isDo = question.type === QUESTION_TYPES.DO
    const isCorrect = isDo ? points > 0 : scoreMultiplier > 0
    const penalty =
      !isDo && !isCorrect && playerAnswer ? (question.penalty ?? 0) : 0

    player.points = Math.max(0, player.points + points - penalty)
    player.streak = isCorrect ? player.streak + 1 : 0

    return {
      ...player,
      lastCorrect: isCorrect,
      lastPoints: isDo || isCorrect ? points : -penalty,
    }
  })

  return scored.sort((a, b) => b.points - a.points)
}

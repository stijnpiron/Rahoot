import type { ResponsesComponentProps } from "@razzia/web/features/questions/types"
import {
  getPuzzleTileColor,
  getPuzzleTileIcon,
} from "@razzia/web/features/questions/puzzle/utils"
import clsx from "clsx"
import { Check, Users } from "lucide-react"

const PuzzleResponses = ({ data }: ResponsesComponentProps) => {
  const { answers, puzzleFullyCorrect } = data

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-md flex-col gap-2">
        {answers.map((answer, index) => {
          const Icon = getPuzzleTileIcon(index)

          return (
            <div
              key={index}
              className={clsx(
                "shadow-inset flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-white",
                getPuzzleTileColor(index),
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-black/20 text-xs">
                {index + 1}
              </span>
              <span className="flex-1 text-lg">{answer}</span>
              <Check className="size-5" />
            </div>
          )
        })}
      </div>

      {puzzleFullyCorrect && (
        <div className="rounded-xl bg-white px-4 py-1.5 text-xl font-bold shadow-md">
          <span className="text-correct inline-flex items-center gap-2">
            <Users className="size-6 stroke-3" />
            {puzzleFullyCorrect.count}/{puzzleFullyCorrect.total}
          </span>
        </div>
      )}
    </div>
  )
}

export default PuzzleResponses

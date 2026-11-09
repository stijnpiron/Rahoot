import type { PreparedComponentProps } from "@razzia/web/features/questions/types"
import {
  getPuzzleTileColor,
  getPuzzleTileIcon,
} from "@razzia/web/features/questions/puzzle/utils"
import clsx from "clsx"

const PuzzlePrepared = ({
  totalAnswers,
  puzzleOrder,
}: PreparedComponentProps) => (
  <div className="anim-quizz grid w-60 grid-cols-2 gap-4 rounded-2xl bg-gray-700 p-5 md:w-60">
    {Array.from({ length: totalAnswers }).map((_, key) => {
      const tileIndex = puzzleOrder?.[key] ?? key
      const Icon = getPuzzleTileIcon(tileIndex)

      return (
        <div
          key={key}
          className={clsx(
            "button shadow-inset flex aspect-square h-full w-full items-center justify-center rounded-2xl",
            getPuzzleTileColor(tileIndex),
          )}
        >
          <Icon className="size-8 text-current" />
        </div>
      )
    })}
  </div>
)

export default PuzzlePrepared

import type { ResponsesComponentProps } from "@razzia/web/features/questions/types"
import { Crown } from "lucide-react"
import { useTranslation } from "react-i18next"

const DoResponses = ({ data }: ResponsesComponentProps) => {
  const { t } = useTranslation()
  const { doRanking } = data

  if (!doRanking || doRanking.length === 0) {
    return null
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      {doRanking.map((entry, index) => (
        <div
          key={entry.playerId}
          className="shadow-inset flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 font-bold text-white"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-black/20 text-xs">
            {index === 0 ? <Crown className="size-4" /> : index + 1}
          </span>
          <span className="flex-1 truncate text-lg">{entry.username}</span>
          {"points" in entry && (
            <span className="text-sm text-white/80">
              {t("game:do.points", { points: entry.points })}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default DoResponses

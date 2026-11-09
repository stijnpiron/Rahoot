import type { PreparedComponentProps } from "@razzia/web/features/questions/types"
import clsx from "clsx"
import { Check, X } from "lucide-react"
import { useTranslation } from "react-i18next"

const TrueFalsePrepared = ({ totalAnswers }: PreparedComponentProps) => {
  const { t } = useTranslation()

  return (
    <div className="anim-quizz grid w-60 grid-cols-2 gap-4 rounded-2xl bg-gray-700 p-5 md:w-60">
      {Array.from({ length: totalAnswers }).map((_, key) => (
        <div
          key={key}
          className={clsx(
            "button shadow-inset flex aspect-square h-full w-full flex-col items-center justify-center gap-2 rounded-2xl",
            key === 0 ? "bg-emerald-600" : "bg-red-500",
          )}
        >
          {key === 0 ? (
            <Check className="size-8 text-white" />
          ) : (
            <X className="size-8 text-white" />
          )}
          <span className="text-lg font-bold text-white">
            {t(`game:trueFalse.${key === 0 ? "true" : "false"}`)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default TrueFalsePrepared

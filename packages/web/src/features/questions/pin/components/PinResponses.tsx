import type { ResponsesComponentProps } from "@razzia/web/features/questions/types"
import PinAreaCanvas from "@razzia/web/features/questions/pin/components/PinAreaCanvas"
import { getPinOptions } from "@razzia/web/features/questions/pin/utils"
import { useTranslation } from "react-i18next"

const PinResponses = ({ data }: ResponsesComponentProps) => {
  const { t } = useTranslation()
  const options = getPinOptions(data.options)

  return (
    <div className="flex flex-col items-center gap-3">
      <PinAreaCanvas
        mediaUrl={data.media?.url}
        alt={data.question}
        area={options.area}
        pins={data.pins}
        className="max-h-[60vh]"
      />
      {data.pins && data.pins.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {data.pins.map((pin, index) => (
            <span
              key={index}
              className={
                pin.correct
                  ? "bg-correct rounded-full px-3 py-1 text-sm font-bold text-white"
                  : "rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white"
              }
            >
              {pin.name}
            </span>
          ))}
        </div>
      )}
      {(!data.pins || data.pins.length === 0) && (
        <p className="text-muted-foreground text-sm">{t("game:pin.noPins")}</p>
      )}
    </div>
  )
}

export default PinResponses

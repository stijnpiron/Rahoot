import { MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"

const PinPrepared = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-4">
      <MapPin className="size-24 text-white drop-shadow-lg" />
      <p className="text-center text-xl font-bold text-white drop-shadow-lg">
        {t("game:pin.teaser")}
      </p>
    </div>
  )
}

export default PinPrepared

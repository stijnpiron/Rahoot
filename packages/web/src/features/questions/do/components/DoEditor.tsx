import { Info } from "lucide-react"
import { useTranslation } from "react-i18next"

const DoEditor = () => {
  const { t } = useTranslation()

  return (
    <div className="bg-background flex items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-sm">
      <Info className="text-primary size-5 shrink-0" />
      <span>{t("quizz:question.do.noAnswers")}</span>
    </div>
  )
}

export default DoEditor

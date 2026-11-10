import { MapPin } from "lucide-react"

const PinPrepared = () => (
  <div className="anim-quizz flex aspect-square w-60 items-center justify-center rounded-2xl bg-gray-700 p-5 md:w-60">
    <div className="button shadow-inset flex aspect-square h-full w-full items-center justify-center rounded-2xl bg-[var(--color-answer-5)]">
      <MapPin className="size-24 text-white drop-shadow-lg" />
    </div>
  </div>
)

export default PinPrepared

import { MapPin } from "lucide-react"

const PinPrepared = () => {
  return (
    <div className="anim-quizz flex aspect-square w-60 items-center justify-center rounded-2xl bg-gray-700 md:w-60">
      <div className="flex flex-col items-center gap-4">
        <MapPin className="size-24 text-white drop-shadow-lg" />
      </div>
    </div>
  )
}

export default PinPrepared

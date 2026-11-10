import { ClipboardList } from "lucide-react"

const DoPrepared = () => {
  return (
    <div className="anim-quizz flex aspect-square w-60 items-center justify-center rounded-2xl bg-gray-700 md:w-60">
      <div className="flex flex-col items-center gap-4">
        <ClipboardList className="size-24 text-white drop-shadow-lg" />
      </div>
    </div>
  )
}

export default DoPrepared

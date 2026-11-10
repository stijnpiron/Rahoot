import type { CommonStatusDataMap } from "@razzia/common/types/game/status"
import QuestionMedia from "@razzia/web/components/QuestionMedia"
import { SFX } from "@razzia/web/features/game/utils/constants"
import { useEffect } from "react"
import useSound from "use-sound"

interface Props {
  data: CommonStatusDataMap["SHOW_SLIDE"]
}

const Slide = ({ data: { title, question, media } }: Props) => {
  const [sfxShow] = useSound(SFX.SHOW_SOUND, { volume: 0.5 })

  useEffect(() => {
    sfxShow()
  }, [sfxShow])

  return (
    <section className="anim-show relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-5 px-4">
      {(title || question) && (
        <div
          className={
            media
              ? "flex flex-col items-center justify-center gap-5"
              : "flex flex-1 flex-col items-center justify-center gap-5"
          }
        >
          {title && (
            <h2 className="text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
              {title}
            </h2>
          )}
          {question && (
            <p className="text-center text-xl text-white drop-shadow-lg md:text-2xl">
              {question}
            </p>
          )}
        </div>
      )}
      {media && (
        <QuestionMedia
          media={media}
          alt={[title, question].find(Boolean) ?? "slide"}
          autoPlay={false}
        />
      )}
    </section>
  )
}

export default Slide

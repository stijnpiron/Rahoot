import { MEDIA_TYPES, MEDIA_URL_PREFIX } from "@razzia/common/constants"
import type {
  QuestionMediaType,
  UploadedMedia,
} from "@razzia/common/types/game"
import { questionMediaValidator } from "@razzia/common/validators/quizz"
import Button from "@razzia/web/components/Button"
import Input from "@razzia/web/components/Input"
import QuestionMedia from "@razzia/web/components/QuestionMedia"
import MediaLibrary from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary"
import {
  UPLOAD_ACCEPT,
  useUploadMedia,
} from "@razzia/web/features/quizz/hooks/useUploadMedia"
import clsx from "clsx"
import {
  ChevronDown,
  Image,
  ImageOff,
  Library,
  Link,
  Music,
  Upload,
  Video,
} from "lucide-react"
import { type ChangeEvent, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import type { QuizzFormValues } from "@razzia/web/features/quizz/contexts/quizz-editor-context"

const MEDIA_TYPE_BUTTONS = [
  { type: MEDIA_TYPES.IMAGE, icon: Image },
  { type: MEDIA_TYPES.VIDEO, icon: Video },
  { type: MEDIA_TYPES.AUDIO, icon: Music },
] as const

const QuizzMediaPicker = () => {
  const { setValue, watch } = useFormContext<QuizzFormValues>()
  const media = watch("media")
  const [isOpen, setIsOpen] = useState(false)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isUrlOpen, setIsUrlOpen] = useState(Boolean(media?.url))
  const { t } = useTranslation()

  const { upload, importUrl, pendingCount, duplicateDialog } = useUploadMedia(
    (item: UploadedMedia) =>
      setValue(
        "media",
        { type: item.type, url: item.url },
        { shouldDirty: true },
      ),
  )
  const isUploading = pendingCount > 0

  const handleUploadMedia = (e: ChangeEvent<HTMLInputElement>) => {
    upload(Array.from(e.target.files ?? []))
    e.target.value = ""
  }

  const handleSelectFromLibrary = (item: UploadedMedia) => {
    setValue("media", { type: item.type, url: item.url }, { shouldDirty: true })
    setIsLibraryOpen(false)
  }

  const handleChangeMediaType = (type: QuestionMediaType) => () => {
    const url = media?.url

    if (!url) {
      return
    }

    if (!url.startsWith(MEDIA_URL_PREFIX)) {
      importUrl(url)

      return
    }

    const result = questionMediaValidator.safeParse({ type, url })

    if (!result.success) {
      return
    }

    setValue("media", result.data, { shouldDirty: true })
  }

  const handleRemoveMedia = () => {
    setValue("media", undefined, { shouldDirty: true })
  }

  const handleChangeMedia = (e: ChangeEvent<HTMLInputElement>) => {
    setValue("media", { url: e.target.value }, { shouldDirty: true })
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="bg-accent text-accent-foreground"
        classNameContent="gap-1.5"
      >
        {(() => {
          if (media?.type === MEDIA_TYPES.IMAGE) {
            return <Image className="size-5" />
          }

          if (media?.type === MEDIA_TYPES.VIDEO) {
            return <Video className="size-5" />
          }

          if (media?.type === MEDIA_TYPES.AUDIO) {
            return <Music className="size-5" />
          }

          return <ImageOff className="size-5" />
        })()}
        <ChevronDown
          className={clsx("size-4 transition", isOpen && "rotate-180")}
        />
      </Button>

      {isOpen && (
        <div className="bg-background absolute top-12 left-0 z-30 flex w-80 flex-col items-center gap-3 rounded-xl p-4 shadow-xl">
          {media?.url ? (
            <QuestionMedia
              media={media}
              alt={t("quizz:titleQuizzPlaceholder")}
              autoPlay={false}
            />
          ) : (
            <ImageOff className="stroke-accent-foreground size-10" />
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <label
              aria-disabled={isUploading}
              className="bg-primary flex cursor-pointer items-center gap-1.5 rounded-lg p-2 text-sm font-semibold text-white hover:brightness-[1.05] active:brightness-[0.95] aria-disabled:cursor-wait aria-disabled:opacity-50"
            >
              <Upload className="size-4" />
              <p>{t("quizz:media.upload")}</p>
              <input
                type="file"
                accept={UPLOAD_ACCEPT}
                className="hidden"
                disabled={isUploading}
                onChange={handleUploadMedia}
              />
            </label>
            <Button
              size="sm"
              onClick={() => setIsLibraryOpen(true)}
              className="bg-accent text-accent-foreground"
              classNameContent="gap-1.5"
            >
              <Library className="size-4" />
              <p>{t("quizz:media.library")}</p>
            </Button>
          </div>

          <button
            onClick={() => setIsUrlOpen((current) => !current)}
            aria-expanded={isUrlOpen}
            className="text-accent-foreground hover:text-foreground flex items-center gap-1 text-sm font-semibold"
          >
            <Link className="size-4" />
            {t("quizz:media.fromUrl")}
            <ChevronDown
              className={clsx("size-4 transition", isUrlOpen && "rotate-180")}
            />
          </button>

          {isUrlOpen && (
            <div className="flex w-full flex-col items-center gap-2">
              <Input
                variant="sm"
                className="w-full"
                placeholder={t("quizz:question.mediaUrlPlaceholder")}
                value={media?.url ?? ""}
                onChange={handleChangeMedia}
              />
              <div className="flex flex-wrap justify-center gap-2">
                {MEDIA_TYPE_BUTTONS.map(({ type, icon: Icon }) => (
                  <Button
                    key={type}
                    size="sm"
                    onClick={handleChangeMediaType(type)}
                    className="bg-accent text-accent-foreground"
                    classNameContent="gap-1.5"
                  >
                    <Icon className="size-4" />
                    {t(`quizz:question.media.${type}`)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {media?.url && (
            <Button
              size="sm"
              onClick={handleRemoveMedia}
              className="bg-accent text-accent-foreground"
            >
              {t("common:delete")}
            </Button>
          )}
        </div>
      )}

      <MediaLibrary
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        onSelect={handleSelectFromLibrary}
      />

      {duplicateDialog}
    </div>
  )
}

export default QuizzMediaPicker

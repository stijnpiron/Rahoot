import { ACCEPTED_MEDIA_TYPES, MAX_MEDIA_SIZE } from "@razzia/common/constants"
import type { UploadedMedia } from "@razzia/common/types/game"
import Button from "@razzia/web/components/Button"
import MediaThumbnail from "@razzia/web/features/quizz/components/QuestionEditor/MediaLibrary/MediaThumbnail"
import { mediaKeys, uploadMedia } from "@razzia/web/features/quizz/queries"
import { ApiError } from "@razzia/web/lib/api"
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { StatusCodes } from "http-status-codes"
import { Dialog } from "radix-ui"
import { type ReactNode, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

export const UPLOAD_ACCEPT = Object.entries(ACCEPTED_MEDIA_TYPES)
  .flatMap(([mime, { ext }]) => [mime, ext])
  .join(",")

const uploadKey = [...mediaKeys.all, "upload"] as const

interface Duplicate {
  media: UploadedMedia
}

export const useUploadMedia = (
  onUploaded?: (_media: UploadedMedia) => void,
) => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [duplicate, setDuplicate] = useState<Duplicate | null>(null)

  const pendingCount = useIsMutating({ mutationKey: uploadKey })

  const { mutate } = useMutation({
    mutationKey: uploadKey,
    mutationFn: uploadMedia,
    onSuccess: (media) => onUploaded?.(media),
    onError: (error) => {
      if (
        error instanceof ApiError &&
        error.status === StatusCodes.CONFLICT &&
        error.data?.media
      ) {
        setDuplicate({ media: error.data.media as UploadedMedia })

        return
      }

      toast.error(
        t(error instanceof ApiError ? error.key : "errors:media.uploadFailed"),
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: mediaKeys.all }),
  })

  const upload = (files: Iterable<File>) => {
    for (const file of files) {
      if (file.size > MAX_MEDIA_SIZE) {
        toast.error(t("errors:media.tooLarge"))

        continue
      }

      mutate(file)
    }
  }

  const resolveDuplicate = (useExisting: boolean) => {
    if (useExisting && duplicate) {
      onUploaded?.(duplicate.media)
    }

    setDuplicate(null)
  }

  const duplicateDialog: ReactNode = duplicate && (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) {
          resolveDuplicate(false)
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade fixed inset-0 z-50 bg-black/40" />

        <Dialog.Content
          aria-describedby={undefined}
          className="bg-background data-[state=open]:animate-fade fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 rounded-xl p-6 shadow-xl"
        >
          <Dialog.Title className="text-foreground text-lg font-semibold">
            {t("quizz:media.duplicateTitle")}
          </Dialog.Title>

          <div className="size-32 overflow-hidden rounded-xl">
            <MediaThumbnail media={duplicate.media} size="sm" />
          </div>

          <p className="text-muted-foreground text-center text-sm">
            {t("errors:media.duplicate", { name: duplicate.media.name })}
          </p>

          <div className="flex w-full justify-center gap-2">
            <Button
              onClick={() => resolveDuplicate(true)}
              className="bg-accent text-accent-foreground"
            >
              {t("quizz:media.useExisting")}
            </Button>
            <Button onClick={() => resolveDuplicate(false)}>
              {t("common:cancel")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )

  return { upload, pendingCount, duplicateDialog }
}

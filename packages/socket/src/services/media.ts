import {
  ACCEPTED_MEDIA_TYPES,
  MEDIA_URL_PREFIX,
} from "@razzia/common/constants"
import type {
  UploadedMedia,
  UploadedMediaType,
} from "@razzia/common/types/game"
import { getPath } from "@razzia/socket/services/config"
import {
  conflict,
  invalidInput,
  notFound,
  unsupportedMediaType,
} from "@razzia/socket/services/errors"
import { normalizeFilename } from "@razzia/socket/utils/file"
import { createHash } from "crypto"
import { fileTypeFromBuffer } from "file-type"
import fs from "fs"
import { extname, join } from "path"

const MAX_SLUG_LENGTH = 32

const EXTENSION_TYPES = new Map<string, UploadedMediaType>(
  Object.values(ACCEPTED_MEDIA_TYPES).map(({ ext, type }) => [ext, type]),
)

const EXTENSIONS = [...EXTENSION_TYPES.keys()]
  .map((ext) => ext.slice(1))
  .join("|")

const MEDIA_NAME_PATTERN = new RegExp(`^[A-Za-z0-9_-]+\\.(${EXTENSIONS})$`, "u")

const getMediaDir = () => getPath("media")

const getHashesPath = () => join(getMediaDir(), "hashes.json")

type MediaHashes = Record<string, string>

const readHashes = (): MediaHashes => {
  try {
    return JSON.parse(fs.readFileSync(getHashesPath(), "utf8")) as MediaHashes
  } catch {
    return {}
  }
}

const writeHashes = (hashes: MediaHashes): void => {
  fs.writeFileSync(getHashesPath(), JSON.stringify(hashes, null, 2))
}

const removeHash = (hashes: MediaHashes, name: string): MediaHashes =>
  Object.fromEntries(Object.entries(hashes).filter(([, n]) => n !== name))

const hashBuffer = (buffer: Buffer) =>
  createHash("sha256").update(buffer).digest("hex")

const findHashByName = (
  hashes: MediaHashes,
  name: string,
): string | undefined =>
  Object.keys(hashes).find((hash) => hashes[hash] === name)

/**
 * Scans the media directory to fill in hashes for files uploaded before the
 * hash store existed, and prunes entries whose file is gone.
 */
const backfillHashes = (hashes: MediaHashes): MediaHashes => {
  const dir = getMediaDir()

  if (!fs.existsSync(dir)) {
    return {}
  }

  const next: MediaHashes = {}

  for (const name of fs.readdirSync(dir)) {
    const path = join(dir, name)

    if (!EXTENSION_TYPES.has(extname(name)) || !isRegularFile(path)) {
      continue
    }

    if (!MEDIA_NAME_PATTERN.test(name)) {
      continue
    }

    const existingHash = findHashByName(hashes, name)

    if (existingHash) {
      next[existingHash] = name

      continue
    }

    next[hashBuffer(fs.readFileSync(path))] = name
  }

  return next
}

const isAcceptedMime = (
  mime: string,
): mime is keyof typeof ACCEPTED_MEDIA_TYPES => mime in ACCEPTED_MEDIA_TYPES

const toUploadedMedia = (
  name: string,
  type: UploadedMediaType,
): UploadedMedia => ({ name, url: `${MEDIA_URL_PREFIX}${name}`, type })

const isRegularFile = (path: string) => {
  try {
    return fs.lstatSync(path).isFile()
  } catch {
    return false
  }
}

export const listMedia = (): UploadedMedia[] => {
  const dir = getMediaDir()

  if (!fs.existsSync(dir)) {
    return []
  }

  return fs
    .readdirSync(dir)
    .flatMap((name) => {
      const type = EXTENSION_TYPES.get(extname(name))
      const path = join(dir, name)

      if (!type || !MEDIA_NAME_PATTERN.test(name) || !isRegularFile(path)) {
        return []
      }

      return [
        {
          media: toUploadedMedia(name, type),
          mtime: fs.statSync(path).mtimeMs,
        },
      ]
    })
    .sort((a, b) => b.mtime - a.mtime)
    .map(({ media }) => media)
}

export const saveMedia = async (file: File): Promise<UploadedMedia> => {
  const buffer = Buffer.from(await file.arrayBuffer())
  const detected = await fileTypeFromBuffer(buffer)

  if (!detected || !isAcceptedMime(detected.mime)) {
    throw unsupportedMediaType("errors:media.invalidType")
  }

  const { ext, type } = ACCEPTED_MEDIA_TYPES[detected.mime]
  const dir = getMediaDir()
  const baseName = file.name.replace(/\.[^.]*$/u, "")
  const generateName = () =>
    `${normalizeFilename(baseName, { fallback: "media", maxLength: MAX_SLUG_LENGTH })}${ext}`

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const hash = hashBuffer(buffer)
  let hashes = readHashes()

  if (!(hash in hashes)) {
    hashes = backfillHashes(hashes)
  }

  const existingName = hashes[hash]

  if (
    existingName &&
    MEDIA_NAME_PATTERN.test(existingName) &&
    isRegularFile(join(dir, existingName))
  ) {
    throw conflict("errors:media.duplicate", {
      media: toUploadedMedia(existingName, type),
    })
  }

  let name = generateName()

  while (fs.existsSync(join(dir, name))) {
    name = generateName()
  }

  fs.writeFileSync(join(dir, name), buffer)
  writeHashes({ ...hashes, [hash]: name })

  return toUploadedMedia(name, type)
}

export const deleteMedia = (name: string): void => {
  if (!MEDIA_NAME_PATTERN.test(name)) {
    throw invalidInput("errors:media.invalidName")
  }

  const path = join(getMediaDir(), name)

  if (!isRegularFile(path)) {
    throw notFound("errors:media.notFound")
  }

  fs.unlinkSync(path)
  deleteMediaHash(name)
}

const deleteMediaHash = (name: string): void => {
  const hashes = readHashes()

  if (findHashByName(hashes, name)) {
    writeHashes(removeHash(hashes, name))
  }
}

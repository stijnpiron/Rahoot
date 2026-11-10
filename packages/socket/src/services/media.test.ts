import { getPath } from "@razzia/socket/services/config"
import {
  deleteMedia,
  importMediaFromUrl,
  listMedia,
  saveMedia,
} from "@razzia/socket/services/media"
import fs from "fs"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const PNG_BYTES = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010806000000",
  "hex",
)

const mediaDir = () => getPath("media")

beforeEach(() => {
  fs.rmSync(mediaDir(), { recursive: true, force: true })
})

describe("saveMedia", () => {
  it("detects the type from the content, not the file name", async () => {
    const media = await saveMedia(new File([PNG_BYTES], "Mon Image.gif"))

    expect(media.type).toBe("image")
    expect(media.name).toMatch(/^mon-image-[\w-]{8}\.png$/u)
    expect(media.url).toBe(`/media/${media.name}`)
    expect(fs.existsSync(join(mediaDir(), media.name))).toBe(true)
  })

  it("rejects files that are not an accepted media", async () => {
    await expect(
      saveMedia(new File(["<script></script>"], "evil.png")),
    ).rejects.toThrow("errors:media.invalidType")
  })

  it("rejects a duplicate upload and returns the existing media", async () => {
    const first = await saveMedia(new File([PNG_BYTES], "image.png"))

    await expect(
      saveMedia(new File([PNG_BYTES], "copy.png")),
    ).rejects.toMatchObject({
      key: "errors:media.duplicate",
      data: { media: { name: first.name } },
    })
    expect(listMedia().map((m) => m.name)).toEqual([first.name])
  })

  it("finds duplicates for files uploaded before the hash store existed", async () => {
    const first = await saveMedia(new File([PNG_BYTES], "image.png"))
    fs.rmSync(join(mediaDir(), "hashes.json"))

    await expect(
      saveMedia(new File([PNG_BYTES], "copy.png")),
    ).rejects.toMatchObject({
      data: { media: { name: first.name } },
    })
  })
})

describe("listMedia", () => {
  it("only lists accepted media files", async () => {
    const media = await saveMedia(new File([PNG_BYTES], "image.png"))

    fs.writeFileSync(join(mediaDir(), "notes.txt"), "")
    fs.writeFileSync(join(mediaDir(), "with space.png"), "")

    expect(listMedia().map((m) => m.name)).toEqual([media.name])
  })
})

describe("importMediaFromUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const stubFetch = (response: Partial<Response>) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(response as Response)),
    )
  }

  const stubBody = (bytes: Uint8Array) => ({
    ok: true,
    headers: new Headers(),
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(bytes)
        controller.close()
      },
    }),
  })

  it("downloads, detects and stores the media", async () => {
    stubFetch(stubBody(PNG_BYTES))

    const media = await importMediaFromUrl(
      "https://example.com/pictures/My%20Cat.png",
    )

    expect(media.type).toBe("image")
    expect(media.name).toMatch(/^my-cat-[\w-]{8}\.png$/u)
    expect(fs.existsSync(join(mediaDir(), media.name))).toBe(true)
  })

  it("rejects non-http protocols", async () => {
    await expect(
      importMediaFromUrl("ftp://example.com/cat.png"),
    ).rejects.toThrow("errors:media.invalidUrl")
  })

  it("rejects a failed download", async () => {
    stubFetch({ ok: false })

    await expect(
      importMediaFromUrl("https://example.com/cat.png"),
    ).rejects.toThrow("errors:media.importFailed")
  })

  it("rejects content that is not an accepted media", async () => {
    stubFetch(stubBody(new TextEncoder().encode("<html></html>")))

    await expect(
      importMediaFromUrl("https://example.com/page"),
    ).rejects.toThrow("errors:media.invalidType")
  })

  it("rejects downloads larger than the media size limit", async () => {
    stubFetch({
      ok: true,
      headers: new Headers({ "content-length": String(101 * 1024 * 1024) }),
    })

    await expect(
      importMediaFromUrl("https://example.com/huge.png"),
    ).rejects.toThrow("errors:media.tooLarge")
  })
})

describe("deleteMedia", () => {
  it("deletes an uploaded media", async () => {
    const media = await saveMedia(new File([PNG_BYTES], "image.png"))

    deleteMedia(media.name)

    expect(listMedia()).toEqual([])
  })

  it("re-uploads the same content after a delete", async () => {
    const first = await saveMedia(new File([PNG_BYTES], "image.png"))
    deleteMedia(first.name)

    const second = await saveMedia(new File([PNG_BYTES], "image.png"))

    expect(second.name).not.toBe(first.name)
  })

  it.each(["../secret.png", "image.exe", "image"])(
    "rejects the name %s",
    (name) => {
      expect(() => deleteMedia(name)).toThrow("errors:media.invalidName")
    },
  )

  it("fails on a missing media", () => {
    expect(() => deleteMedia("missing.png")).toThrow("errors:media.notFound")
  })
})

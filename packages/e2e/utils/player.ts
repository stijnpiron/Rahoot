import { expect, type Locator, type Page } from "@playwright/test"
import { t } from "@razzia/e2e/utils/i18n"

export const typePin = async (page: Page, pin: string) => {
  await page.goto("/")
  await page
    .getByRole("textbox", { name: t("game:pinDigit", { position: 1 }) })
    .click()
  await page.keyboard.type(pin)
}

export const enterPin = async (page: Page, pin: string) => {
  await typePin(page, pin)
  await page.getByRole("button", { name: t("common:submit") }).click()
}

export const joinGame = async (page: Page, pin: string, username: string) => {
  await page.goto(`/?pin=${pin}`)
  await page.getByPlaceholder(t("game:usernamePlaceholder")).fill(username)
  await page.getByRole("button", { name: t("common:submit") }).click()
  await expect(page.getByText(t("game:waitingForPlayers"))).toBeVisible()
}

export const answer = async (page: Page, label: string) => {
  await page
    .getByRole("button", { name: new RegExp(`^[A-D] ${label}$`, "u") })
    .click()
}

export const answerTrueFalse = async (page: Page, value: string) => {
  await page.getByRole("button", { name: t(`game:trueFalse.${value}`) }).click()
}

const moveTileToPosition = async (
  page: Page,
  tiles: Locator,
  move: { from: number; to: number },
) => {
  // Keyboard dragging is deterministic, unlike synthesized mouse drags.
  await tiles.nth(move.from).focus()
  await page.keyboard.press("Space")

  // Wait until dnd-kit reports the tile as picked up.
  // oxlint-disable-next-line
  await page.waitForFunction(
    (index) =>
      Array.from(document.querySelectorAll("[data-puzzle-tile]"))[
        index
      ]?.getAttribute("aria-pressed") === "true",
    move.from,
    { timeout: 3000 },
  )

  const key = move.from > move.to ? "ArrowUp" : "ArrowDown"

  for (let step = 0; step < Math.abs(move.from - move.to); step += 1) {
    // oxlint-disable-next-line
    await page.keyboard.press(key)
    // oxlint-disable-next-line
    await page.waitForTimeout(100)
  }

  await page.keyboard.press("Space")

  // Wait until the tile is dropped before continuing.
  // oxlint-disable-next-line
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("[data-puzzle-tile]")).every(
        (tile) => tile.getAttribute("aria-pressed") !== "true",
      ),
    undefined,
    { timeout: 3000 },
  )
}

const waitForTileOrder = async (
  page: Page,
  expected: string,
): Promise<boolean> => {
  try {
    // oxlint-disable-next-line
    await page.waitForFunction(
      ({ selector, waitForExpected }) =>
        JSON.stringify(
          Array.from(document.querySelectorAll(selector)).map((tile) =>
            tile.textContent.trim(),
          ),
        ) === waitForExpected,
      { selector: "[data-puzzle-tile]", waitForExpected: expected },
      { timeout: 3000 },
    )

    return true
  } catch {
    return false
  }
}

export const solvePuzzle = async (page: Page, correct: string[]) => {
  const tiles = page.locator("[data-puzzle-tile]")
  const maxMoves = correct.length * correct.length * 3

  await tiles.first().waitFor({ state: "visible", timeout: 15000 })

  for (let move = 0; move < maxMoves; move += 1) {
    // Sequential on purpose: each move depends on the previous tile order.
    // oxlint-disable-next-line
    const current = await tiles.allTextContents()

    const mismatch = current.findIndex(
      (text, position) => text.trim() !== correct[position],
    )

    if (mismatch === -1) {
      break
    }

    const sourceIndex = current.findIndex(
      (text) => text.trim() === correct[mismatch],
    )

    // oxlint-disable-next-line
    await moveTileToPosition(page, tiles, {
      from: sourceIndex,
      to: mismatch,
    })

    // Wait until the DOM reflects the move before reading the order again.
    const reordered = [...current]
    const [moved] = reordered.splice(sourceIndex, 1)

    reordered.splice(mismatch, 0, moved)

    // oxlint-disable-next-line
    await waitForTileOrder(
      page,
      JSON.stringify(reordered.map((text) => text.trim())),
    )
  }

  // oxlint-disable-next-line
  await confirm(page)
}

export const confirm = async (page: Page) => {
  await page.getByRole("button", { name: t("game:confirm") }).click()
}

export const dropPin = async (page: Page, xRatio: number, yRatio: number) => {
  const image = page.locator(`img[alt="${t("game:pin.imageAlt")}"]`)

  await image.waitFor({ state: "visible", timeout: 15000 })

  const box = await image.boundingBox()

  if (!box) {
    throw new Error("Pin image not visible")
  }

  await page.mouse.click(
    box.x + box.width * xRatio,
    box.y + box.height * yRatio,
  )
  await page.getByRole("button", { name: t("game:pin.confirm") }).click()
}

export const expectPoints = async (page: Page, points: number) => {
  const display = String(Math.round(points * 100) / 100)

  await expect(page.getByText(display, { exact: true })).toBeVisible()
}

import type { Page } from "@playwright/test"
import { DO_QUIZZ } from "@razzia/e2e/utils/constants"
import { expect, test } from "@razzia/e2e/utils/fixtures"
import { t } from "@razzia/e2e/utils/i18n"
import { createGame, next, startGame } from "@razzia/e2e/utils/manager"
import { expectPoints, joinGame } from "@razzia/e2e/utils/player"

// The websocket can drop right after joining; a reload re-enters via
// player:reconnect and recovers the current status.
const tapDone = async (player: Page) => {
  const done = player.getByRole("button", { name: t("game:do.done") })

  try {
    await done.click({ timeout: 5000 })
  } catch {
    await player.reload()
    await done.click({ timeout: 20000 })
  }
}

test("manager ranks players and points follow the order", async ({
  page: manager,
  newPage,
}) => {
  const pin = await createGame(manager, DO_QUIZZ)
  const alice = await newPage()
  const bob = await newPage()

  await joinGame(alice, pin, "Alice")
  await joinGame(bob, pin, "Bob")
  // The HTTP join resolves before the websocket join lands server-side;
  // wait until the manager actually sees the players before starting.
  await expect(manager.getByText("Alice")).toBeVisible()
  await expect(manager.getByText("Bob")).toBeVisible()
  await startGame(manager)

  await tapDone(alice)
  await expect(
    manager.getByText("Alice").locator("xpath=ancestor::*[@data-do-row]"),
  ).toBeVisible()

  // Bob sits at the bottom until the manager drags him above Alice.
  // Keyboard dragging is deterministic, unlike synthesized mouse drags.
  const bobRow = manager.locator("[data-do-row]", { hasText: "Bob" })

  await bobRow.waitFor({ state: "visible" })
  await bobRow.focus()
  await manager.keyboard.press("Space")
  await manager.keyboard.press("ArrowUp")
  await manager.keyboard.press("Space")

  await expect(manager.locator("[data-do-row]").first()).toHaveText(/Bob/u)

  await manager
    .getByRole("button", { name: t("game:do.submit") })
    .click()

  await expect(bob.getByText("+1000")).toBeVisible()
  await expect(alice.getByText("+0")).toBeVisible()
  await expectPoints(bob, 1000)
  await expectPoints(alice, 0)

  await expect(manager.getByText("Bob").first()).toBeVisible()
  await next(manager)
})

test("drag to rank writes the order into the reveal", async ({
  page: manager,
  newPage,
}) => {
  const pin = await createGame(manager, DO_QUIZZ)
  const alice = await newPage()

  await joinGame(alice, pin, "Alice")
  await expect(manager.getByText("Alice")).toBeVisible()
  await startGame(manager)

  await tapDone(alice)

  await manager
    .getByRole("button", { name: t("game:do.submit") })
    .click()

  await expect(
    manager.getByText(t("game:do.points", { points: 1000 })),
  ).toBeVisible()
  await expect(alice.getByText("+1000")).toBeVisible()
})

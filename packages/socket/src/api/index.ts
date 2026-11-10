import { auth } from "@razzia/socket/api/routes/auth"
import { games } from "@razzia/socket/api/routes/games"
import { media } from "@razzia/socket/api/routes/media"
import { quizz } from "@razzia/socket/api/routes/quizz"
import { results } from "@razzia/socket/api/routes/results"
import { publicUrl } from "@razzia/socket/env"
import { Hono } from "hono"

const routes = new Hono()
  .get("/health", (c) => c.json({ status: "ok" }))
  .get("/config", (c) => c.json({ publicUrl: publicUrl ?? null }))
  .route("/auth", auth)
  .route("/quizz", quizz)
  .route("/results", results)
  .route("/games", games)
  .route("/media", media)

export const api = routes

export type ApiType = typeof routes

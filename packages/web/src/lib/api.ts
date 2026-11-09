import type { ApiType } from "@razzia/socket/api"
import { clearToken, ensureSession } from "@razzia/web/lib/session"
import { hc } from "hono/client"
import { StatusCodes } from "http-status-codes"

export class ApiError extends Error {
  readonly status: StatusCodes
  readonly key: string
  readonly data?: Record<string, unknown>

  constructor(
    status: StatusCodes,
    key: string,
    data?: Record<string, unknown>,
  ) {
    super(key)
    this.status = status
    this.key = key
    this.data = data
  }
}

const authFetch: typeof fetch = async (input, init) => {
  const { token } = await ensureSession()
  const headers = new Headers(init?.headers)

  headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(input, { ...init, headers })
  const status: StatusCodes = response.status

  if (status === StatusCodes.UNAUTHORIZED) {
    clearToken()

    throw new ApiError(StatusCodes.UNAUTHORIZED, "errors:auth.unauthorized")
  }

  return response
}

export const api = hc<ApiType>("/api", { fetch: authFetch })

const readError = async (response: Response, fallback: string) => {
  try {
    const body = (await response.json()) as {
      error?: string
    } & Record<string, unknown>

    const { error: key, ...data } = body

    return { key: key ?? fallback, data }
  } catch {
    return { key: fallback, data: {} as Record<string, unknown> }
  }
}

interface AnyClientResponse {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

type ApiSuccess<R> = R extends { status: infer S; json: () => Promise<infer T> }
  ? S extends StatusCodes.OK | StatusCodes.CREATED
    ? T
    : never
  : never

export const unwrap = async <R extends AnyClientResponse>(
  request: Promise<R>,
  fallback = "errors:route.description",
): Promise<ApiSuccess<R>> => {
  const response = await request

  if (!response.ok) {
    const { key, data } = await readError(
      response as unknown as Response,
      fallback,
    )

    throw new ApiError(response.status, key, data)
  }

  return (await response.json()) as ApiSuccess<R>
}

export const unwrapEmpty = async (
  request: Promise<AnyClientResponse>,
  fallback = "errors:route.description",
): Promise<void> => {
  const response = await request

  if (!response.ok) {
    const { key, data } = await readError(
      response as unknown as Response,
      fallback,
    )

    throw new ApiError(response.status, key, data)
  }
}

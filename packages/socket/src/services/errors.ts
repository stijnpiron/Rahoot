import { StatusCodes } from "http-status-codes"

type DomainErrorStatus =
  | StatusCodes.BAD_REQUEST
  | StatusCodes.CONFLICT
  | StatusCodes.NOT_FOUND
  | StatusCodes.UNSUPPORTED_MEDIA_TYPE
  | StatusCodes.INTERNAL_SERVER_ERROR

export class DomainError extends Error {
  readonly key: string
  readonly status: DomainErrorStatus
  readonly data?: Record<string, unknown>

  constructor(
    key: string,
    status: DomainErrorStatus,
    data?: Record<string, unknown>,
  ) {
    super(key)
    this.key = key
    this.status = status
    this.data = data
  }
}

export const conflict = (key: string, data?: Record<string, unknown>) =>
  new DomainError(key, StatusCodes.CONFLICT, data)

export const notFound = (key: string) =>
  new DomainError(key, StatusCodes.NOT_FOUND)

export const invalidInput = (key: string) =>
  new DomainError(key, StatusCodes.BAD_REQUEST)

export const unsupportedMediaType = (key: string) =>
  new DomainError(key, StatusCodes.UNSUPPORTED_MEDIA_TYPE)

export const serverError = (key: string) =>
  new DomainError(key, StatusCodes.INTERNAL_SERVER_ERROR)

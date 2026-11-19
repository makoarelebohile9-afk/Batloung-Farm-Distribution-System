export class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
    this.details = details
  }
}

export function badRequest(message, details) {
  return new HttpError(400, message, details)
}

export function notFound(message) {
  return new HttpError(404, message)
}

export function conflict(message) {
  return new HttpError(409, message)
}


export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error)
    return
  }

  const candidateStatus = error.statusCode ?? error.status
  const statusCode =
    Number.isInteger(candidateStatus) && candidateStatus >= 400 && candidateStatus < 600
      ? candidateStatus
      : 500
  const message =
    statusCode === 500
      ? 'An unexpected server error occurred.'
      : error.type === 'entity.parse.failed'
        ? 'The request body contains malformed JSON.'
        : error.message

  if (statusCode === 500) {
    console.error('Unhandled API error:', error)
  }

  if (error.code === 'ER_DUP_ENTRY') {
    response.status(409).json({
      error: 'Conflict',
      message: 'A record with the supplied unique value already exists.',
    })
    return
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
    response.status(409).json({
      error: 'Conflict',
      message: 'This record cannot be deleted because it is used by existing transactions.',
    })
    return
  }

  response.status(statusCode).json({
    error:
      statusCode === 500
        ? 'Internal Server Error'
        : statusCode === 400
          ? 'Bad Request'
          : statusCode === 404
            ? 'Not Found'
            : statusCode === 409
              ? 'Conflict'
              : 'Request Error',
    message,
    ...(error.details === undefined ? {} : { details: error.details }),
  })
}


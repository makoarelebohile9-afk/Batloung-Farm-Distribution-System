export function notFoundHandler(request, response) {
  response.status(404).json({
    error: 'Not Found',
    message: `No API route matches ${request.method} ${request.originalUrl}.`,
  })
}


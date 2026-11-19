import express from 'express'
import { config } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFoundHandler } from './middleware/notFound.js'
import apiRouter from './routes/index.js'
import { asyncHandler } from './middleware/asyncHandler.js'
import { pool } from './config/database.js'

const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))

if (config.corsOrigin) {
  const allowedOrigins = config.corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.use((request, response, next) => {
    const origin = request.get('Origin')
    if (origin && allowedOrigins.includes(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin)
      response.setHeader('Vary', 'Origin')
      response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      response.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      )
    }

    if (request.method === 'OPTIONS') {
      response.status(204).end()
      return
    }
    next()
  })
}

app.get(
  '/api/health',
  asyncHandler(async (request, response) => {
    try {
      await pool.query('SELECT 1')
      response.json({ status: 'ok', database: 'connected' })
    } catch (error) {
      console.error('Database health check failed:', error)
      response.status(503).json({
        status: 'unavailable',
        database: 'disconnected',
        message: 'The API is running, but the database is unavailable.',
      })
    }
  }),
)

app.use('/api', apiRouter)
app.use(notFoundHandler)
app.use(errorHandler)

export default app


import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: resolve(backendDirectory, '.env') })

function positiveInteger(value, defaultValue, variableName) {
  const parsed = Number(value ?? defaultValue)

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${variableName} must be a positive integer.`)
  }

  return parsed
}

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: positiveInteger(process.env.PORT, 3000, 'PORT'),
  database: Object.freeze({
    host: process.env.DB_HOST ?? 'localhost',
    port: positiveInteger(process.env.DB_PORT, 3306, 'DB_PORT'),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'batloung_farm_distribution',
    connectionLimit: positiveInteger(
      process.env.DB_CONNECTION_LIMIT,
      10,
      'DB_CONNECTION_LIMIT',
    ),
  }),
  corsOrigin: process.env.CORS_ORIGIN ?? '',
})


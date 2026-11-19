import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { config } from '../src/config/env.js'

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

async function setupDatabase() {
  let connection
  try {
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      multipleStatements: true,
    })

    const schema = await readFile(
      resolve(projectDirectory, 'Database', 'schema.sql'),
      'utf8',
    )
    const sampleData = await readFile(
      resolve(projectDirectory, 'Database', 'seed.sql'),
      'utf8',
    )
    await connection.query(schema)
    await connection.query(sampleData)
    console.info('Batloung Farm schema and sample data were applied successfully.')
  } catch (error) {
    console.error('Database setup failed:', error.message)
    process.exitCode = 1
  } finally {
    if (connection) {
      try {
        await connection.end()
      } catch (error) {
        console.error('Could not close the setup database connection:', error.message)
        process.exitCode = 1
      }
    }
  }
}

setupDatabase()


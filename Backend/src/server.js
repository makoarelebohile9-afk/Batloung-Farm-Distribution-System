import app from './app.js'
import { config } from './config/env.js'
import { pool } from './config/database.js'

const server = app.listen(config.port, () => {
  console.info(`Batloung Farm API listening on port ${config.port}.`)
})

server.on('error', (error) => {
  console.error('The API server could not start:', error)
  process.exitCode = 1
})

pool.query('SELECT 1')
  .then(() => {
    console.info('MySQL connection is ready.')
  })
  .catch((error) => {
    console.error(
      'MySQL is unavailable. The API will remain running and report database errors until it reconnects:',
      error.message,
    )
  })

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async (serverError) => {
      try {
        await pool.end()
        if (serverError) {
          console.error('The API server did not close cleanly:', serverError)
          process.exitCode = 1
        }
      } catch (databaseError) {
        console.error('The database pool did not close cleanly:', databaseError)
        process.exitCode = 1
      }
    })
  })
}


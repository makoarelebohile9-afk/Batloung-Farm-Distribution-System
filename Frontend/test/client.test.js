import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiError, createApiClient } from '../src/api/client.js'

test('vendor search and district filters are encoded in the API URL', async () => {
  const requests = []
  const api = createApiClient({
    baseUrl: 'http://localhost:3000/api/',
    fetchImpl: async (url) => {
      requests.push(url)
      return {
        ok: true,
        status: 200,
        async json() {
          return { data: [{ vendor_id: 1, district: 'Maseru' }] }
        },
      }
    },
  })

  const result = await api.vendors.list({ search: 'Market stall', district: 'Maseru' })

  assert.deepEqual(result, [{ vendor_id: 1, district: 'Maseru' }])
  assert.equal(
    requests[0],
    'http://localhost:3000/api/vendors?search=Market+stall&district=Maseru',
  )
})

test('an API stock conflict becomes a typed client error', async () => {
  const api = createApiClient({
    fetchImpl: async () => ({
      ok: false,
      status: 409,
      async json() {
        return { message: 'Insufficient LARGE stock.' }
      },
    }),
  })

  await assert.rejects(
    api.sales.create({
      vendorId: 1,
      paymentMethod: 'CREDIT',
      items: [{ fruitId: 1, packagingSize: 'LARGE', quantity: 10 }],
    }),
    (error) =>
      error instanceof ApiError &&
      error.status === 409 &&
      error.message === 'Insufficient LARGE stock.',
  )
})

test('an unreachable backend proxy returns a helpful error', async () => {
  const api = createApiClient({
    fetchImpl: async () => ({
      ok: false,
      status: 502,
      async json() {
        throw new SyntaxError('Unexpected token')
      },
    }),
  })

  await assert.rejects(
    api.suppliers.list(),
    (error) =>
      error instanceof ApiError &&
      error.status === 502 &&
      error.message.includes('Start the backend') &&
      error.message.includes('port 3000'),
  )
})

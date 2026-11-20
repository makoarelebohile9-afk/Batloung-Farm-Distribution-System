
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function queryString(parameters = {}) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  }

  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

function pathId(id, field) {
  if (id === undefined || id === null || String(id).trim() === '') {
    throw new TypeError(`${field} is required.`)
  }

  return encodeURIComponent(String(id))
}

export function createApiClient({
  baseUrl = 'https://batloung-farm-distribution-system-mjoh.onrender.com/api',
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('A fetch implementation is required.')
  }

  const root = baseUrl.replace(/\/+$/, '')

  async function request(path, { method = 'GET', body } = {}) {
    let response

    try {
      response = await fetchImpl(`${root}${path}`, {
        method,
        headers: body === undefined
          ? undefined
          : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch (error) {
      throw new ApiError(
        0,
        'Could not reach the API. Check that the backend is running.',
        error instanceof Error ? error.message : undefined,
      )
    }

    let payload = null

    if (response.status !== 204) {
      try {
        payload = await response.json()
      } catch {
        if (response.status === 502) {
          throw new ApiError(
            response.status,
            'The API proxy could not reach the backend.',
          )
        }

        throw new ApiError(
          response.status,
          'The API returned an invalid response.',
        )
      }
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        payload?.message ?? 'The API request failed.',
        payload?.details,
      )
    }

    return payload?.data ?? payload
  }

  function collection(path, idField = 'id') {
    return {
      list(parameters = {}) {
        return request(`${path}${queryString(parameters)}`)
      },

      get(id) {
        return request(`${path}/${pathId(id, idField)}`)
      },

      create(body) {
        return request(path, { method: 'POST', body })
      },

      update(id, body) {
        return request(`${path}/${pathId(id, idField)}`, {
          method: 'PUT',
          body,
        })
      },

      delete(id) {
        return request(`${path}/${pathId(id, idField)}`, {
          method: 'DELETE',
        })
      },
    }
  }

  const vendors = collection('/vendors', 'vendorId')

  vendors.balance = (vendorId) =>
    request(`/vendors/${pathId(vendorId, 'vendorId')}/balance`)

  return Object.freeze({
    health: () => request('/health'),

    suppliers: collection('/suppliers', 'supplierId'),

    fruits: collection('/fruits', 'fruitId'),

    stock: {
      list: () => request('/stock'),

      low: (threshold = 10) =>
        request(`/stock/low${queryString({ threshold })}`),
    },

    vendors: {
      ...vendors,

      list: ({ search, district } = {}) =>
        request(`/vendors${queryString({ search, district })}`),
    },

    purchases: collection('/purchases', 'purchaseId'),

    sales: {
      ...collection('/sales', 'saleId'),

      list: ({ vendorId } = {}) =>
        request(`/sales${queryString({ vendorId })}`),
    },

    payments: {
      list: (vendorId) =>
        request(`/payments${queryString({ vendorId })}`),

      create: (body) =>
        request('/payments', { method: 'POST', body }),
    },

    reports: {
      topSellingFruits: () =>
        request('/reports/top-selling-fruits'),

      salesRevenue: (fromDate, toDate) =>
        request(`/reports/sales-revenue${queryString({ fromDate, toDate })}`),

      topVendor: () =>
        request('/reports/top-vendor'),

      salesByDistrict: () =>
        request('/reports/sales-by-district'),
    },
  })
}

export const api = createApiClient()

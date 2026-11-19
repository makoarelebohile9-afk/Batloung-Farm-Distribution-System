import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveVendorFilter } from '../src/controllers/paymentController.js'

test('payments list treats a missing vendor filter as an all-payments request', () => {
  assert.equal(resolveVendorFilter({}), null)
  assert.equal(resolveVendorFilter({ vendorId: '' }), null)
})

test('payments list coerces vendorId values to a positive integer', () => {
  assert.equal(resolveVendorFilter({ vendorId: '3' }), 3)
  assert.throws(() => resolveVendorFilter({ vendorId: '0' }), { statusCode: 400 })
})

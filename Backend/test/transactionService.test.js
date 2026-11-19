import assert from 'node:assert/strict'
import test from 'node:test'
import { recordSale } from '../src/services/transactionService.js'

function createTransactionHarness({ availableStock = 6 } = {}) {
  const calls = {
    commit: 0,
    rollback: 0,
    insertedSales: 0,
    insertedDetails: 0,
    insertedPayments: 0,
    stockAdjustments: [],
  }
  const connection = {
    async beginTransaction() {},
    async commit() {
      calls.commit += 1
    },
    async rollback() {
      calls.rollback += 1
    },
    release() {},
  }
  const pool = {
    async getConnection() {
      return connection
    },
  }

  const models = {
    vendor: {
      async findById() {
        return { vendor_id: 1 }
      },
    },
    fruit: {
      async findById() {
        return [{ fruit_id: 1, status: 'ACTIVE' }]
      },
      async findPrice(connection, fruitId, size) {
        return fruitId === 1 && size === 'LARGE' ? '360.00' : '100.00'
      },
    },
    stock: {
      async ensureRow() {},
      async findForUpdate() {
        return availableStock
      },
      async adjust(connection, fruitId, packagingSize, delta) {
        calls.stockAdjustments.push({ fruitId, packagingSize, delta })
        return true
      },
    },
    sale: {
      async create() {
        calls.insertedSales += 1
        return 42
      },
      async createDetail() {
        calls.insertedDetails += 1
      },
    },
    payment: {
      async create() {
        calls.insertedPayments += 1
      },
    },
  }

  return { calls, pool, models }
}

test('a multi-item sale with insufficient stock rolls back before writing anything', async () => {
  const harness = createTransactionHarness()

  await assert.rejects(
    recordSale(
      {
        vendorId: 1,
        paymentMethod: 'CREDIT',
        paidAmount: null,
        items: [
          { fruitId: 1, packagingSize: 'LARGE', quantity: 10 },
        ],
      },
      harness,
    ),
    { statusCode: 409 },
  )

  assert.equal(harness.calls.rollback, 1)
  assert.equal(harness.calls.commit, 0)
  assert.equal(harness.calls.insertedSales, 0)
  assert.equal(harness.calls.insertedDetails, 0)
  assert.equal(harness.calls.insertedPayments, 0)
  assert.deepEqual(harness.calls.stockAdjustments, [])
})

test('a successful multi-item sale calculates totals and records a partial payment', async () => {
  const harness = createTransactionHarness({ availableStock: 20 })
  const result = await recordSale(
    {
      vendorId: 1,
      paymentMethod: 'MOBILE_MONEY',
      paidAmount: '400.00',
      items: [
        { fruitId: 1, packagingSize: 'LARGE', quantity: 1 },
        { fruitId: 1, packagingSize: 'SMALL', quantity: 2 },
      ],
    },
    harness,
  )

  assert.equal(result.totalAmount, '560.00')
  assert.equal(result.amountPaid, '400.00')
  assert.equal(result.outstandingBalance, '160.00')
  assert.equal(result.paymentStatus, 'PARTIALLY_PAID')
  assert.equal(harness.calls.commit, 1)
  assert.equal(harness.calls.rollback, 0)
  assert.equal(harness.calls.insertedSales, 1)
  assert.equal(harness.calls.insertedDetails, 2)
  assert.equal(harness.calls.insertedPayments, 1)
  assert.deepEqual(harness.calls.stockAdjustments, [
    { fruitId: 1, packagingSize: 'LARGE', delta: -1 },
    { fruitId: 1, packagingSize: 'SMALL', delta: -2 },
  ])
})


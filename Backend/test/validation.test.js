import assert from 'node:assert/strict'
import test from 'node:test'
import {
  moneyToCents,
  packagingSize,
  queryDate,
} from '../src/utils/validation.js'

test('money amounts are converted to exact cents', () => {
  assert.equal(moneyToCents('19.95', 'amount'), 1995)
  assert.equal(moneyToCents(20, 'amount'), 2000)
  assert.equal(moneyToCents('0.00', 'amount', { allowZero: true }), 0)
})

test('money rejects excessive precision and negative values', () => {
  assert.throws(() => moneyToCents('1.239', 'amount'), { statusCode: 400 })
  assert.throws(() => moneyToCents('-1.00', 'amount'), { statusCode: 400 })
})

test('packaging sizes normalize case and reject unlisted values', () => {
  assert.equal(packagingSize('large'), 'LARGE')
  assert.throws(() => packagingSize('XL'), { statusCode: 400 })
})

test('date validation rejects impossible dates', () => {
  assert.equal(queryDate('2026-11-21', 'fromDate'), '2026-11-21')
  assert.throws(() => queryDate('2026-02-30', 'fromDate'), { statusCode: 400 })
})


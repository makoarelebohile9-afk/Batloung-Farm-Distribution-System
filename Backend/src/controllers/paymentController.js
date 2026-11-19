import { pool } from '../config/database.js'
import * as paymentModel from '../models/paymentModel.js'
import { recordPayment } from '../services/transactionService.js'
import {
  bodyObject,
  enumValue,
  moneyToCents,
  positiveInteger,
} from '../utils/validation.js'

export function resolveVendorFilter(query = {}) {
  if (query.vendorId === undefined || query.vendorId === null || query.vendorId === '') {
    return null
  }

  return positiveInteger(query.vendorId, 'vendorId')
}

function parsePayment(value) {
  const body = bodyObject(value)
  const paymentMethod = enumValue(
    body.paymentMethod,
    ['CASH', 'MOBILE_MONEY'],
    'paymentMethod',
  )
  moneyToCents(body.amount, 'amount')
  return {
    saleId: positiveInteger(body.saleId, 'saleId'),
    paymentMethod,
    amount: body.amount,
  }
}

export async function listVendorPayments(request, response) {
  const vendorId = resolveVendorFilter(request.query)
  response.json({ data: await paymentModel.findForVendor(pool, vendorId) })
}

export async function createPayment(request, response) {
  const result = await recordPayment(parsePayment(request.body))
  response.status(201).json({ data: result })
}


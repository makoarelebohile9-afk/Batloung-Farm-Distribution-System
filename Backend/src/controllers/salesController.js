import { pool } from '../config/database.js'
import * as salesModel from '../models/salesModel.js'
import { recordSale } from '../services/transactionService.js'
import { notFound } from '../utils/errors.js'
import {
  bodyObject,
  enumValue,
  itemArray,
  moneyToCents,
  packagingSize,
  positiveInteger,
} from '../utils/validation.js'

function parseSale(value) {
  const body = bodyObject(value)
  const items = itemArray(body.items).map((item, index) => {
    const line = bodyObject(item)
    return {
      fruitId: positiveInteger(line.fruitId, `items[${index}].fruitId`),
      packagingSize: packagingSize(line.packagingSize, `items[${index}].packagingSize`),
      quantity: positiveInteger(line.quantity, `items[${index}].quantity`),
    }
  })

  const paymentMethod = enumValue(
    body.paymentMethod,
    ['CASH', 'MOBILE_MONEY', 'CREDIT'],
    'paymentMethod',
  )
  if (body.paidAmount !== undefined) {
    moneyToCents(body.paidAmount, 'paidAmount', { allowZero: true })
  }

  return {
    vendorId: positiveInteger(body.vendorId, 'vendorId'),
    items,
    paymentMethod,
    paidAmount: body.paidAmount ?? null,
  }
}

export async function listSales(request, response) {
  const vendorId =
    request.query.vendorId === undefined
      ? null
      : positiveInteger(request.query.vendorId, 'vendorId')
  response.json({ data: await salesModel.findAll(pool, vendorId) })
}

export async function getSale(request, response) {
  const saleId = positiveInteger(request.params.saleId, 'saleId')
  const sale = await salesModel.findById(pool, saleId)
  if (!sale) {
    throw notFound(`Sale ${saleId} was not found.`)
  }
  response.json({ data: sale })
}

export async function createSale(request, response) {
  const result = await recordSale(parseSale(request.body))
  response.status(201).json({ data: result })
}


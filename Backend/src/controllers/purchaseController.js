import { pool } from '../config/database.js'
import * as purchaseModel from '../models/purchaseModel.js'
import { recordPurchase } from '../services/transactionService.js'
import { notFound } from '../utils/errors.js'
import {
  bodyObject,
  itemArray,
  moneyToCents,
  packagingSize,
  positiveInteger,
} from '../utils/validation.js'

function parsePurchase(value) {
  const body = bodyObject(value)
  const items = itemArray(body.items).map((item, index) => {
    const line = bodyObject(item)
    moneyToCents(line.unitCost, `items[${index}].unitCost`)
    return {
      fruitId: positiveInteger(line.fruitId, `items[${index}].fruitId`),
      packagingSize: packagingSize(line.packagingSize, `items[${index}].packagingSize`),
      quantity: positiveInteger(line.quantity, `items[${index}].quantity`),
      unitCost: line.unitCost,
    }
  })

  return {
    supplierId: positiveInteger(body.supplierId, 'supplierId'),
    items,
  }
}

export async function listPurchases(request, response) {
  response.json({ data: await purchaseModel.findAll(pool) })
}

export async function getPurchase(request, response) {
  const purchaseId = positiveInteger(request.params.purchaseId, 'purchaseId')
  const purchase = await purchaseModel.findById(pool, purchaseId)
  if (!purchase) {
    throw notFound(`Purchase ${purchaseId} was not found.`)
  }
  response.json({ data: purchase })
}

export async function createPurchase(request, response) {
  const result = await recordPurchase(parsePurchase(request.body))
  response.status(201).json({ data: result })
}


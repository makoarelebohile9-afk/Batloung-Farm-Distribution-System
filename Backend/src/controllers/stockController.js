import { pool } from '../config/database.js'
import * as stockModel from '../models/stockModel.js'
import { nonNegativeInteger } from '../utils/validation.js'

export async function listStock(request, response) {
  response.json({ data: await stockModel.findAll(pool) })
}

export async function listLowStock(request, response) {
  const threshold =
    request.query.threshold === undefined
      ? 10
      : nonNegativeInteger(request.query.threshold, 'threshold')
  response.json({
    data: await stockModel.findLowStock(pool, threshold),
    threshold,
  })
}


import { pool } from '../config/database.js'
import * as fruitModel from '../models/fruitModel.js'
import { badRequest, conflict, notFound } from '../utils/errors.js'
import {
  bodyObject,
  enumValue,
  moneyToCents,
  optionalText,
  PACKAGING_SIZES,
  positiveInteger,
  requiredText,
} from '../utils/validation.js'

function parseFruit(value, requirePrices = false) {
  const body = bodyObject(value)
  const status =
    body.status === undefined
      ? 'ACTIVE'
      : enumValue(body.status, ['ACTIVE', 'INACTIVE'], 'status')
  const fruit = {
    fruitName: requiredText(body.fruitName, 'fruitName', 100),
    description: optionalText(body.description, 'description', 500),
    status,
  }

  if (body.sellingPrices === undefined && !requirePrices) {
    return { fruit, prices: null }
  }

  const suppliedPrices = body.sellingPrices
  if (!suppliedPrices || typeof suppliedPrices !== 'object' || Array.isArray(suppliedPrices)) {
    throw badRequest('sellingPrices must define SMALL, MEDIUM, and LARGE amounts.')
  }

  const prices = PACKAGING_SIZES.map((packagingSize) => {
    const price = suppliedPrices[packagingSize] ?? suppliedPrices[packagingSize.toLowerCase()]
    if (price === undefined) {
      throw badRequest(`sellingPrices must include ${packagingSize}.`)
    }
    moneyToCents(price, `sellingPrices.${packagingSize}`)
    return { packagingSize, unitPrice: Number(price).toFixed(2) }
  })

  const cents = prices.map((price) => moneyToCents(price.unitPrice, 'selling price'))
  if (new Set(cents).size !== PACKAGING_SIZES.length) {
    throw badRequest('Each packaging size must have a different selling price.')
  }

  return { fruit, prices }
}

function mapFruit(rows) {
  if (rows.length === 0) {
    return null
  }

  const first = rows[0]
  return {
    fruitId: first.fruit_id,
    fruitName: first.fruit_name,
    description: first.description,
    status: first.status,
    createdAt: first.created_at,
    sellingPrices: Object.fromEntries(
      rows
        .filter((row) => row.packaging_size !== null)
        .map((row) => [row.packaging_size, row.unit_price]),
    ),
  }
}

export async function listFruits(request, response) {
  const rows = await fruitModel.findAll(pool)
  const fruits = new Map()
  for (const row of rows) {
    if (!fruits.has(row.fruit_id)) {
      fruits.set(row.fruit_id, [])
    }
    fruits.get(row.fruit_id).push(row)
  }
  response.json({ data: [...fruits.values()].map(mapFruit) })
}

export async function getFruit(request, response) {
  const fruitId = positiveInteger(request.params.fruitId, 'fruitId')
  const fruit = mapFruit(await fruitModel.findById(pool, fruitId))
  if (!fruit) {
    throw notFound(`Fruit ${fruitId} was not found.`)
  }
  response.json({ data: fruit })
}

export async function createFruit(request, response) {
  const { fruit, prices } = parseFruit(request.body, true)
  const connection = await pool.getConnection()
  let transactionStarted = false
  try {
    await connection.beginTransaction()
    transactionStarted = true
    const fruitId = await fruitModel.create(connection, fruit)
    await fruitModel.insertPrices(connection, fruitId, prices)
    await connection.commit()
    transactionStarted = false
    response.status(201).json({
      data: mapFruit(await fruitModel.findById(pool, fruitId)),
    })
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error('Failed to roll back fruit creation:', rollbackError)
      }
    }
    throw error
  } finally {
    connection.release()
  }
}

export async function updateFruit(request, response) {
  const fruitId = positiveInteger(request.params.fruitId, 'fruitId')
  const { fruit, prices } = parseFruit(request.body)
  const existing = await fruitModel.findById(pool, fruitId)
  if (existing.length === 0) {
    throw notFound(`Fruit ${fruitId} was not found.`)
  }

  const connection = await pool.getConnection()
  let transactionStarted = false
  try {
    await connection.beginTransaction()
    transactionStarted = true
    await fruitModel.update(connection, fruitId, fruit)
    if (prices) {
      await fruitModel.updatePrices(connection, fruitId, prices)
    }
    await connection.commit()
    transactionStarted = false
    response.json({
      data: mapFruit(await fruitModel.findById(pool, fruitId)),
    })
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error('Failed to roll back fruit update:', rollbackError)
      }
    }
    throw error
  } finally {
    connection.release()
  }
}

export async function deleteFruit(request, response) {
  const fruitId = positiveInteger(request.params.fruitId, 'fruitId')
  if ((await fruitModel.findById(pool, fruitId)).length === 0) {
    throw notFound(`Fruit ${fruitId} was not found.`)
  }
  if (await fruitModel.hasTransactions(pool, fruitId)) {
    throw conflict('A fruit with purchase or sales history cannot be deleted.')
  }
  await fruitModel.remove(pool, fruitId)
  response.status(204).end()
}


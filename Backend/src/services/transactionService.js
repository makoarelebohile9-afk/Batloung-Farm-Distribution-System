import { pool as defaultPool } from '../config/database.js'
import * as fruitModel from '../models/fruitModel.js'
import * as paymentModel from '../models/paymentModel.js'
import * as purchaseModel from '../models/purchaseModel.js'
import * as salesModel from '../models/salesModel.js'
import * as stockModel from '../models/stockModel.js'
import * as supplierModel from '../models/supplierModel.js'
import * as vendorModel from '../models/vendorModel.js'
import { badRequest, conflict, notFound } from '../utils/errors.js'
import {
  centsFromDatabase,
  formatCents,
  moneyToCents,
} from '../utils/validation.js'

const MAX_AMOUNT_CENTS = 999_999_999_999

function assertAmountRange(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_AMOUNT_CENTS) {
    throw badRequest('The calculated total exceeds the supported amount range.')
  }
}

function paymentStatus(totalCents, paidCents) {
  if (paidCents <= 0) {
    return 'UNPAID'
  }
  return paidCents >= totalCents ? 'PAID' : 'PARTIALLY_PAID'
}

function checkedItems(items) {
  const required = new Map()
  for (const item of items) {
    const key = `${item.fruitId}:${item.packagingSize}`
    required.set(key, (required.get(key) ?? 0) + item.quantity)
  }

  for (const [key, quantity] of required) {
    if (!Number.isSafeInteger(quantity)) {
      throw badRequest(`The combined quantity for ${key} is too large.`)
    }
  }
  return required
}

async function inTransaction(pool, operation) {
  const connection = await pool.getConnection()
  let transactionStarted = false
  try {
    await connection.beginTransaction()
    transactionStarted = true
    const result = await operation(connection)
    await connection.commit()
    transactionStarted = false
    return result
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error('Failed to roll back a database transaction:', rollbackError)
      }
    }
    throw error
  } finally {
    connection.release()
  }
}

export async function recordPurchase(
  { supplierId, items },
  { pool = defaultPool, models = {} } = {},
) {
  const suppliers = models.supplier ?? supplierModel
  const fruits = models.fruit ?? fruitModel
  const stock = models.stock ?? stockModel
  const purchases = models.purchase ?? purchaseModel

  return inTransaction(pool, async (connection) => {
    if (!(await suppliers.findById(connection, supplierId))) {
      throw notFound(`Supplier ${supplierId} was not found.`)
    }

    let totalCents = 0
    const preparedItems = items.map((item) => {
      const unitCostCents = moneyToCents(item.unitCost, 'unitCost')
      totalCents += item.quantity * unitCostCents
      return { ...item, unitCost: formatCents(unitCostCents) }
    })
    assertAmountRange(totalCents)

    for (const item of preparedItems) {
      const fruit = await fruits.findById(connection, item.fruitId)
      if (!fruit || fruit.length === 0 || fruit[0]?.status === 'INACTIVE') {
        throw notFound(`Active fruit ${item.fruitId} was not found.`)
      }
    }

    const purchaseId = await purchases.create(
      connection,
      supplierId,
      formatCents(totalCents),
    )

    for (const item of preparedItems) {
      await purchases.createDetail(connection, purchaseId, item)
      await stock.ensureRow(connection, item.fruitId, item.packagingSize)
      const updated = await stock.adjust(
        connection,
        item.fruitId,
        item.packagingSize,
        item.quantity,
      )
      if (!updated) {
        throw conflict('Stock could not be updated for the purchase item.')
      }
    }

    return {
      purchaseId,
      supplierId,
      totalAmount: formatCents(totalCents),
      items: preparedItems,
    }
  })
}

export async function recordSale(
  { vendorId, items, paymentMethod, paidAmount },
  { pool = defaultPool, models = {} } = {},
) {
  const vendors = models.vendor ?? vendorModel
  const fruits = models.fruit ?? fruitModel
  const stock = models.stock ?? stockModel
  const sales = models.sale ?? salesModel
  const payments = models.payment ?? paymentModel

  return inTransaction(pool, async (connection) => {
    if (!(await vendors.findById(connection, vendorId))) {
      throw notFound(`Vendor ${vendorId} was not found.`)
    }

    const requiredStock = checkedItems(items)
    const stockKeys = [...requiredStock.keys()].sort((first, second) => {
      const [firstFruit, firstSize] = first.split(':')
      const [secondFruit, secondSize] = second.split(':')
      return Number(firstFruit) - Number(secondFruit) ||
        firstSize.localeCompare(secondSize)
    })

    for (const key of stockKeys) {
      const [fruitId, packagingSize] = key.split(':')
      const fruit = await fruits.findById(connection, Number(fruitId))
      if (!fruit || fruit.length === 0 || fruit[0]?.status === 'INACTIVE') {
        throw notFound(`Active fruit ${fruitId} was not found.`)
      }

      await stock.ensureRow(connection, Number(fruitId), packagingSize)
      const available = await stock.findForUpdate(
        connection,
        Number(fruitId),
        packagingSize,
      )
      const needed = requiredStock.get(key)
      if (available < needed) {
        throw conflict(
          `Insufficient ${packagingSize.toLowerCase()} stock for fruit ${fruitId}: ${available} available, ${needed} requested.`,
        )
      }
    }

    let totalCents = 0
    const preparedItems = []
    for (const item of items) {
      const price = await fruits.findPrice(
        connection,
        item.fruitId,
        item.packagingSize,
      )
      if (price === null) {
        throw conflict(
          `No selling price is configured for fruit ${item.fruitId} (${item.packagingSize}).`,
        )
      }
      const unitPriceCents = centsFromDatabase(price, 'unit price')
      totalCents += item.quantity * unitPriceCents
      preparedItems.push({
        ...item,
        unitPrice: formatCents(unitPriceCents),
      })
    }
    assertAmountRange(totalCents)

    const paidCents =
      paidAmount === null
        ? paymentMethod === 'CREDIT'
          ? 0
          : totalCents
        : moneyToCents(paidAmount, 'paidAmount', { allowZero: true })

    if (paymentMethod === 'CREDIT' && paidCents !== 0) {
      throw badRequest('CREDIT sales cannot include an upfront paidAmount.')
    }
    if (paidCents > totalCents) {
      throw badRequest('paidAmount cannot exceed the calculated sale total.')
    }
    if (paymentMethod !== 'CREDIT' && paidCents === 0) {
      throw badRequest('A CASH or MOBILE_MONEY sale must include a payment.')
    }

    const status = paymentStatus(totalCents, paidCents)
    const saleId = await sales.create(
      connection,
      vendorId,
      formatCents(totalCents),
      status,
    )
    for (const item of preparedItems) {
      await sales.createDetail(connection, saleId, item)
    }
    for (const key of stockKeys) {
      const [fruitId, packagingSize] = key.split(':')
      const quantity = requiredStock.get(key)
      const updated = await stock.adjust(
        connection,
        Number(fruitId),
        packagingSize,
        -quantity,
      )
      if (!updated) {
        throw conflict('Stock changed before the sale could be completed.')
      }
    }

    await payments.create(
      connection,
      saleId,
      paymentMethod,
      formatCents(paidCents),
    )

    return {
      saleId,
      vendorId,
      totalAmount: formatCents(totalCents),
      amountPaid: formatCents(paidCents),
      outstandingBalance: formatCents(totalCents - paidCents),
      paymentStatus: status,
      items: preparedItems,
    }
  })
}

export async function recordPayment(
  { saleId, paymentMethod, amount },
  { pool = defaultPool, models = {} } = {},
) {
  const sales = models.sale ?? salesModel
  const payments = models.payment ?? paymentModel

  return inTransaction(pool, async (connection) => {
    const sale = await sales.findForUpdate(connection, saleId)
    if (!sale) {
      throw notFound(`Sale ${saleId} was not found.`)
    }

    const totalCents = centsFromDatabase(sale.total_amount, 'sale total')
    const paidCents = centsFromDatabase(
      await payments.totalPaidForSale(connection, saleId),
      'paid amount',
    )
    const amountCents = moneyToCents(amount, 'amount')
    const remainingCents = totalCents - paidCents

    if (amountCents > remainingCents) {
      throw badRequest(
        `Payment exceeds the outstanding balance of ${formatCents(remainingCents)}.`,
      )
    }

    await payments.create(
      connection,
      saleId,
      paymentMethod,
      formatCents(amountCents),
    )
    const status = paymentStatus(totalCents, paidCents + amountCents)
    await sales.updatePaymentStatus(connection, saleId, status)

    return {
      saleId,
      amount: formatCents(amountCents),
      outstandingBalance: formatCents(remainingCents - amountCents),
      paymentStatus: status,
    }
  })
}


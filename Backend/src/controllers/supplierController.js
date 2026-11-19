import { pool } from '../config/database.js'
import * as supplierModel from '../models/supplierModel.js'
import { conflict, notFound } from '../utils/errors.js'
import {
  bodyObject,
  enumValue,
  positiveInteger,
  PROVINCES,
  requiredText,
} from '../utils/validation.js'

function parseSupplier(value) {
  const body = bodyObject(value)
  return {
    businessName: requiredText(body.businessName, 'businessName', 150),
    contactPerson: requiredText(body.contactPerson, 'contactPerson', 120),
    phone: requiredText(body.phone, 'phone', 32),
    province: enumValue(body.province, PROVINCES, 'province'),
    address: requiredText(body.address, 'address'),
  }
}

export async function listSuppliers(request, response) {
  response.json({ data: await supplierModel.findAll(pool) })
}

export async function getSupplier(request, response) {
  const supplierId = positiveInteger(request.params.supplierId, 'supplierId')
  const supplier = await supplierModel.findById(pool, supplierId)
  if (!supplier) {
    throw notFound(`Supplier ${supplierId} was not found.`)
  }
  response.json({ data: supplier })
}

export async function createSupplier(request, response) {
  const supplier = parseSupplier(request.body)
  const supplierId = await supplierModel.create(pool, supplier)
  response.status(201).json({
    data: await supplierModel.findById(pool, supplierId),
  })
}

export async function updateSupplier(request, response) {
  const supplierId = positiveInteger(request.params.supplierId, 'supplierId')
  const supplier = parseSupplier(request.body)
  const updated = await supplierModel.update(pool, supplierId, supplier)
  if (!updated && !(await supplierModel.findById(pool, supplierId))) {
    throw notFound(`Supplier ${supplierId} was not found.`)
  }
  response.json({ data: await supplierModel.findById(pool, supplierId) })
}

export async function deleteSupplier(request, response) {
  const supplierId = positiveInteger(request.params.supplierId, 'supplierId')
  if (!(await supplierModel.findById(pool, supplierId))) {
    throw notFound(`Supplier ${supplierId} was not found.`)
  }
  if (await supplierModel.hasPurchases(pool, supplierId)) {
    throw conflict('A supplier with purchase history cannot be deleted.')
  }
  await supplierModel.remove(pool, supplierId)
  response.status(204).end()
}


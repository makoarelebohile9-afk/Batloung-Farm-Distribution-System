import { pool } from '../config/database.js'
import * as paymentModel from '../models/paymentModel.js'
import * as vendorModel from '../models/vendorModel.js'
import { badRequest, notFound } from '../utils/errors.js'
import {
  bodyObject,
  enumValue,
  LESOTHO_DISTRICTS,
  optionalText,
  positiveInteger,
  requiredText,
} from '../utils/validation.js'

function parseVendor(value) {
  const body = bodyObject(value)
  const registrationDate =
    body.registrationDate === undefined
      ? null
      : requiredText(body.registrationDate, 'registrationDate', 10)
  if (registrationDate !== null) {
    const parsedDate = new Date(`${registrationDate}T00:00:00.000Z`)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(registrationDate) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== registrationDate
    ) {
      throw badRequest('registrationDate must be a valid date in YYYY-MM-DD format.')
    }
  }

  return {
    vendorName: requiredText(body.vendorName, 'vendorName', 150),
    phoneNumber: requiredText(body.phoneNumber, 'phoneNumber', 32),
    district: enumValue(body.district, LESOTHO_DISTRICTS, 'district'),
    location: requiredText(body.location, 'location'),
    registrationDate,
  }
}

export async function listVendors(request, response) {
  const searchTerm = optionalText(request.query.search, 'search', 150)
  const district =
    request.query.district === undefined
      ? null
      : enumValue(request.query.district, LESOTHO_DISTRICTS, 'district')
  response.json({
    data: await vendorModel.findAll(pool, searchTerm, district),
  })
}

export async function getVendor(request, response) {
  const vendorId = positiveInteger(request.params.vendorId, 'vendorId')
  const vendor = await vendorModel.findById(pool, vendorId)
  if (!vendor) {
    throw notFound(`Vendor ${vendorId} was not found.`)
  }
  response.json({ data: vendor })
}

export async function createVendor(request, response) {
  const vendor = parseVendor(request.body)
  const vendorId = await vendorModel.create(pool, vendor)
  response.status(201).json({
    data: await vendorModel.findById(pool, vendorId),
  })
}

export async function updateVendor(request, response) {
  const vendorId = positiveInteger(request.params.vendorId, 'vendorId')
  const vendor = parseVendor(request.body)
  const updated = await vendorModel.update(pool, vendorId, vendor)
  if (!updated && !(await vendorModel.findById(pool, vendorId))) {
    throw notFound(`Vendor ${vendorId} was not found.`)
  }
  response.json({ data: await vendorModel.findById(pool, vendorId) })
}

export async function getVendorBalance(request, response) {
  const vendorId = positiveInteger(request.params.vendorId, 'vendorId')
  const vendor = await vendorModel.findById(pool, vendorId)
  if (!vendor) {
    throw notFound(`Vendor ${vendorId} was not found.`)
  }

  const balance = await paymentModel.vendorBalance(pool, vendorId)
  response.json({
    data: {
      vendorId,
      vendorName: vendor.vendor_name,
      totalSales: balance.total_sales,
      totalPaid: balance.total_paid,
      outstandingBalance: balance.outstanding_balance,
    },
  })
}


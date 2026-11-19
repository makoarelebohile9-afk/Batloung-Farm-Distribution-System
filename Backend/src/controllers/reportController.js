import { pool } from '../config/database.js'
import * as reportModel from '../models/reportModel.js'
import { badRequest } from '../utils/errors.js'
import { queryDate } from '../utils/validation.js'

export async function topSellingFruits(request, response) {
  response.json({ data: await reportModel.topSellingFruits(pool) })
}

export async function salesRevenue(request, response) {
  const fromDate = queryDate(request.query.fromDate, 'fromDate')
  const toDate = queryDate(request.query.toDate, 'toDate')
  if (fromDate > toDate) {
    throw badRequest('fromDate must be on or before toDate.')
  }

  response.json({
    data: {
      fromDate,
      toDate,
      ...(await reportModel.salesRevenue(pool, fromDate, toDate)),
    },
  })
}

export async function topVendor(request, response) {
  response.json({ data: await reportModel.topVendor(pool) })
}

export async function salesByDistrict(request, response) {
  response.json({ data: await reportModel.salesByDistrict(pool) })
}


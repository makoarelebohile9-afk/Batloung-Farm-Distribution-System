import { badRequest } from './errors.js'

export const PACKAGING_SIZES = Object.freeze(['SMALL', 'MEDIUM', 'LARGE'])
export const PROVINCES = Object.freeze([
  'Gauteng',
  'Free State',
  'KwaZulu-Natal',
  'Western Cape',
  'Eastern Cape',
  'Limpopo',
  'Mpumalanga',
  'North West',
])
export const LESOTHO_DISTRICTS = Object.freeze([
  'Berea',
  'Butha-Buthe',
  'Leribe',
  'Mafeteng',
  'Maseru',
  "Mohale's Hoek",
  'Mokhotlong',
  "Qacha's Nek",
  'Quthing',
  'Thaba-Tseka',
])
export const PAYMENT_METHODS = Object.freeze(['CASH', 'MOBILE_MONEY', 'CREDIT'])
export const PAYMENT_STATUSES = Object.freeze([
  'PAID',
  'PARTIALLY_PAID',
  'UNPAID',
])

export function bodyObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw badRequest('The request body must be a JSON object.')
  }

  return value
}

export function requiredText(value, field, maxLength = 255) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw badRequest(`${field} is required and must be a non-empty string.`)
  }

  const normalized = value.trim()
  if (normalized.length > maxLength) {
    throw badRequest(`${field} must be no more than ${maxLength} characters.`)
  }

  return normalized
}

export function optionalText(value, field, maxLength = 255, defaultValue = '') {
  if (value === undefined) {
    return defaultValue
  }

  if (typeof value !== 'string') {
    throw badRequest(`${field} must be a string.`)
  }

  const normalized = value.trim()
  if (normalized.length > maxLength) {
    throw badRequest(`${field} must be no more than ${maxLength} characters.`)
  }

  return normalized
}

export function positiveInteger(value, field) {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw badRequest(`${field} must be a positive integer.`)
  }

  return parsed
}

export function nonNegativeInteger(value, field) {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw badRequest(`${field} must be a non-negative integer.`)
  }

  return parsed
}

export function moneyToCents(value, field, { allowZero = false } = {}) {
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw badRequest(`${field} must be a valid amount with at most two decimal places.`)
  }

  const normalized = String(value).trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) {
    throw badRequest(`${field} must be a valid amount with at most two decimal places.`)
  }

  const cents = Math.round(Number(normalized) * 100)
  if (!Number.isSafeInteger(cents) || (!allowZero && cents <= 0)) {
    throw badRequest(`${field} must be ${allowZero ? 'non-negative' : 'greater than zero'}.`)
  }

  return cents
}

export function centsFromDatabase(value, field) {
  const cents = Math.round(Number(value) * 100)
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error(`The database returned an invalid ${field} amount.`)
  }

  return cents
}

export function formatCents(cents) {
  return (cents / 100).toFixed(2)
}

export function packagingSize(value, field = 'packagingSize') {
  if (typeof value !== 'string') {
    throw badRequest(`${field} must be SMALL, MEDIUM, or LARGE.`)
  }

  const normalized = value.trim().toUpperCase()
  if (!PACKAGING_SIZES.includes(normalized)) {
    throw badRequest(`${field} must be SMALL, MEDIUM, or LARGE.`)
  }

  return normalized
}

export function enumValue(value, allowedValues, field) {
  if (typeof value !== 'string') {
    throw badRequest(`${field} must be one of: ${allowedValues.join(', ')}.`)
  }

  const normalized = value.trim().toUpperCase()
  const result = allowedValues.find((allowed) => allowed.toUpperCase() === normalized)
  if (!result) {
    throw badRequest(`${field} must be one of: ${allowedValues.join(', ')}.`)
  }

  return result
}

export function itemArray(value, field = 'items') {
  if (!Array.isArray(value) || value.length === 0) {
    throw badRequest(`${field} must contain at least one item.`)
  }

  return value
}

export function queryDate(value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw badRequest(`${field} must be a date in YYYY-MM-DD format.`)
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw badRequest(`${field} must be a valid calendar date.`)
  }

  return value
}


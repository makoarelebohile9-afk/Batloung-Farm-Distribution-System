export function formatMoney(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    return '—'
  }
  return `M ${new Intl.NumberFormat('en-LS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`
}

export function formatDate(value) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('en-LS', { dateStyle: 'medium' }).format(date)
}

export function titleCase(value) {
  if (!value) {
    return '—'
  }
  return String(value)
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}


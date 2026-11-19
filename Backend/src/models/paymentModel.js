export async function create(connection, saleId, paymentMethod, amount) {
  const [result] = await connection.execute(
    `INSERT INTO payments (sale_id, payment_method, amount)
     VALUES (?, ?, ?)`,
    [saleId, paymentMethod, amount],
  )
  return result.insertId
}

export async function findAll(connection) {
  const [rows] = await connection.execute(
    `SELECT p.payment_id, p.sale_id, p.payment_method, p.amount, p.paid_at,
            s.vendor_id, v.vendor_name
     FROM payments AS p
     JOIN sales AS s ON s.sale_id = p.sale_id
     JOIN vendors AS v ON v.vendor_id = s.vendor_id
     ORDER BY p.paid_at DESC, p.payment_id DESC`,
  )
  return rows
}

export async function totalPaidForSale(connection, saleId) {
  const [rows] = await connection.execute(
    `SELECT COALESCE(SUM(amount), 0.00) AS amount_paid
     FROM payments
     WHERE sale_id = ?`,
    [saleId],
  )
  return rows[0].amount_paid
}

export async function findForVendor(connection, vendorId) {
  if (vendorId === null || vendorId === undefined) {
    return findAll(connection)
  }

  const [rows] = await connection.execute(
    `SELECT p.payment_id, p.sale_id, p.payment_method, p.amount, p.paid_at,
            s.vendor_id, v.vendor_name
     FROM payments AS p
     JOIN sales AS s ON s.sale_id = p.sale_id
     JOIN vendors AS v ON v.vendor_id = s.vendor_id
     WHERE s.vendor_id = ?
     ORDER BY p.paid_at DESC, p.payment_id DESC`,
    [vendorId],
  )
  return rows
}

export async function vendorBalance(connection, vendorId) {
  const [rows] = await connection.execute(
    `SELECT
       COALESCE(SUM(s.total_amount), 0.00) AS total_sales,
       COALESCE(SUM(p.paid_amount), 0.00) AS total_paid,
       COALESCE(SUM(s.total_amount - p.paid_amount), 0.00) AS outstanding_balance
     FROM sales AS s
     LEFT JOIN (
       SELECT sale_id, SUM(amount) AS paid_amount
       FROM payments
       GROUP BY sale_id
     ) AS p ON p.sale_id = s.sale_id
     WHERE s.vendor_id = ?`,
    [vendorId],
  )
  return rows[0]
}


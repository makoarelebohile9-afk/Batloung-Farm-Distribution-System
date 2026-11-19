export async function create(connection, vendorId, totalAmount, paymentStatus) {
  const [result] = await connection.execute(
    `INSERT INTO sales (vendor_id, total_amount, payment_status)
     VALUES (?, ?, ?)`,
    [vendorId, totalAmount, paymentStatus],
  )
  return result.insertId
}

export async function createDetail(connection, saleId, item) {
  await connection.execute(
    `INSERT INTO sales_details
       (sale_id, fruit_id, packaging_size, quantity, unit_price)
     VALUES (?, ?, ?, ?, ?)`,
    [
      saleId,
      item.fruitId,
      item.packagingSize,
      item.quantity,
      item.unitPrice,
    ],
  )
}

export async function findForUpdate(connection, saleId) {
  const [rows] = await connection.execute(
    `SELECT sale_id, vendor_id, sale_date, payment_status, total_amount
     FROM sales
     WHERE sale_id = ?
     FOR UPDATE`,
    [saleId],
  )
  return rows[0] ?? null
}

export async function updatePaymentStatus(connection, saleId, paymentStatus) {
  const [result] = await connection.execute(
    'UPDATE sales SET payment_status = ? WHERE sale_id = ?',
    [paymentStatus, saleId],
  )
  return result.affectedRows > 0
}

export async function findAll(connection, vendorId) {
  const [rows] = await connection.execute(
    `SELECT s.sale_id, s.vendor_id, v.vendor_name, s.sale_date,
            s.payment_status, s.total_amount
     FROM sales AS s
     JOIN vendors AS v ON v.vendor_id = s.vendor_id
     WHERE (? IS NULL OR s.vendor_id = ?)
     ORDER BY s.sale_date DESC, s.sale_id DESC`,
    [vendorId, vendorId],
  )
  return rows
}

export async function findById(connection, saleId) {
  const [rows] = await connection.execute(
    `SELECT s.sale_id, s.vendor_id, v.vendor_name, s.sale_date,
            s.payment_status, s.total_amount
     FROM sales AS s
     JOIN vendors AS v ON v.vendor_id = s.vendor_id
     WHERE s.sale_id = ?`,
    [saleId],
  )
  if (!rows[0]) {
    return null
  }

  const [items] = await connection.execute(
    `SELECT sd.sales_detail_id, sd.fruit_id, f.fruit_name,
            sd.packaging_size, sd.quantity, sd.unit_price
     FROM sales_details AS sd
     JOIN fruits AS f ON f.fruit_id = sd.fruit_id
     WHERE sd.sale_id = ?
     ORDER BY sd.sales_detail_id`,
    [saleId],
  )
  return { ...rows[0], items }
}


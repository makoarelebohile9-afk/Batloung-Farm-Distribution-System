export async function findAll(connection, searchTerm = '', district = null) {
  const pattern = `%${searchTerm}%`
  const [rows] = await connection.execute(
    `SELECT vendors.vendor_id, vendors.vendor_name, vendors.phone_number,
            vendors.district, vendors.location, vendors.registration_date,
            vendors.created_at,
            COALESCE(balances.total_sales, 0.00) AS total_sales,
            COALESCE(balances.total_paid, 0.00) AS total_paid,
            COALESCE(balances.outstanding_balance, 0.00) AS outstanding_balance
     FROM vendors
     LEFT JOIN (
       SELECT sales.vendor_id,
              SUM(sales.total_amount) AS total_sales,
              SUM(COALESCE(payments.amount_paid, 0.00)) AS total_paid,
              SUM(sales.total_amount - COALESCE(payments.amount_paid, 0.00)) AS outstanding_balance
       FROM sales
       LEFT JOIN (
         SELECT sale_id, SUM(amount) AS amount_paid
         FROM payments
         GROUP BY sale_id
       ) AS payments ON payments.sale_id = sales.sale_id
       GROUP BY sales.vendor_id
     ) AS balances ON balances.vendor_id = vendors.vendor_id
     WHERE (? = '' OR vendors.vendor_name LIKE ?
       OR vendors.phone_number LIKE ? OR vendors.district LIKE ?)
       AND (? IS NULL OR vendors.district = ?)
     ORDER BY vendors.vendor_name`,
    [searchTerm, pattern, pattern, pattern, district, district],
  )
  return rows
}

export async function findById(connection, vendorId) {
  const [rows] = await connection.execute(
    `SELECT vendor_id, vendor_name, phone_number, district, location,
            registration_date, created_at
     FROM vendors
     WHERE vendor_id = ?`,
    [vendorId],
  )
  return rows[0] ?? null
}

export async function create(connection, vendor) {
  const [result] = await connection.execute(
    `INSERT INTO vendors
       (vendor_name, phone_number, district, location, registration_date)
     VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_DATE))`,
    [
      vendor.vendorName,
      vendor.phoneNumber,
      vendor.district,
      vendor.location,
      vendor.registrationDate ?? null,
    ],
  )
  return result.insertId
}

export async function update(connection, vendorId, vendor) {
  const [result] = await connection.execute(
    `UPDATE vendors
     SET vendor_name = ?, phone_number = ?, district = ?, location = ?,
         registration_date = COALESCE(?, registration_date)
     WHERE vendor_id = ?`,
    [
      vendor.vendorName,
      vendor.phoneNumber,
      vendor.district,
      vendor.location,
      vendor.registrationDate,
      vendorId,
    ],
  )
  return result.affectedRows > 0
}


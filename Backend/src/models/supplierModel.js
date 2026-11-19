export async function findAll(connection) {
  const [rows] = await connection.execute(
    `SELECT supplier_id, business_name, contact_person, phone, province, address, created_at
     FROM suppliers
     ORDER BY business_name`,
  )
  return rows
}

export async function findById(connection, supplierId) {
  const [rows] = await connection.execute(
    `SELECT supplier_id, business_name, contact_person, phone, province, address, created_at
     FROM suppliers
     WHERE supplier_id = ?`,
    [supplierId],
  )
  return rows[0] ?? null
}

export async function create(connection, supplier) {
  const [result] = await connection.execute(
    `INSERT INTO suppliers (business_name, contact_person, phone, province, address)
     VALUES (?, ?, ?, ?, ?)`,
    [
      supplier.businessName,
      supplier.contactPerson,
      supplier.phone,
      supplier.province,
      supplier.address,
    ],
  )
  return result.insertId
}

export async function update(connection, supplierId, supplier) {
  const [result] = await connection.execute(
    `UPDATE suppliers
     SET business_name = ?, contact_person = ?, phone = ?, province = ?, address = ?
     WHERE supplier_id = ?`,
    [
      supplier.businessName,
      supplier.contactPerson,
      supplier.phone,
      supplier.province,
      supplier.address,
      supplierId,
    ],
  )
  return result.affectedRows > 0
}

export async function hasPurchases(connection, supplierId) {
  const [rows] = await connection.execute(
    'SELECT 1 FROM purchases WHERE supplier_id = ? LIMIT 1',
    [supplierId],
  )
  return rows.length > 0
}

export async function remove(connection, supplierId) {
  const [result] = await connection.execute(
    'DELETE FROM suppliers WHERE supplier_id = ?',
    [supplierId],
  )
  return result.affectedRows > 0
}


export async function create(connection, supplierId, totalAmount) {
  const [result] = await connection.execute(
    'INSERT INTO purchases (supplier_id, total_amount) VALUES (?, ?)',
    [supplierId, totalAmount],
  )
  return result.insertId
}

export async function createDetail(connection, purchaseId, item) {
  await connection.execute(
    `INSERT INTO purchase_details
       (purchase_id, fruit_id, quantity, unit_cost, packaging_size)
     VALUES (?, ?, ?, ?, ?)`,
    [
      purchaseId,
      item.fruitId,
      item.quantity,
      item.unitCost,
      item.packagingSize,
    ],
  )
}

export async function findAll(connection) {
  const [rows] = await connection.execute(
    `SELECT p.purchase_id, p.supplier_id, s.business_name AS supplier_name,
            p.purchase_date, p.total_amount
     FROM purchases AS p
     JOIN suppliers AS s ON s.supplier_id = p.supplier_id
     ORDER BY p.purchase_date DESC, p.purchase_id DESC`,
  )
  return rows
}

export async function findById(connection, purchaseId) {
  const [rows] = await connection.execute(
    `SELECT p.purchase_id, p.supplier_id, s.business_name AS supplier_name,
            p.purchase_date, p.total_amount
     FROM purchases AS p
     JOIN suppliers AS s ON s.supplier_id = p.supplier_id
     WHERE p.purchase_id = ?`,
    [purchaseId],
  )
  if (!rows[0]) {
    return null
  }

  const [items] = await connection.execute(
    `SELECT pd.purchase_detail_id, pd.fruit_id, f.fruit_name,
            pd.packaging_size, pd.quantity, pd.unit_cost
     FROM purchase_details AS pd
     JOIN fruits AS f ON f.fruit_id = pd.fruit_id
     WHERE pd.purchase_id = ?
     ORDER BY pd.purchase_detail_id`,
    [purchaseId],
  )
  return { ...rows[0], items }
}


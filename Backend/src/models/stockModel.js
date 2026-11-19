export async function findAll(connection) {
  const [rows] = await connection.execute(
    `SELECT f.fruit_id, f.fruit_name, sizes.packaging_size,
            COALESCE(st.available_quantity, 0) AS available_quantity
     FROM fruits AS f
     CROSS JOIN (
       SELECT 'SMALL' AS packaging_size
       UNION ALL SELECT 'MEDIUM'
       UNION ALL SELECT 'LARGE'
     ) AS sizes
     LEFT JOIN stock AS st
       ON st.fruit_id = f.fruit_id
       AND st.packaging_size = sizes.packaging_size
     WHERE f.status = 'ACTIVE'
     ORDER BY f.fruit_name, FIELD(sizes.packaging_size, 'SMALL', 'MEDIUM', 'LARGE')`,
  )
  return rows
}

export async function findLowStock(connection, threshold) {
  const [rows] = await connection.execute(
    `SELECT f.fruit_id, f.fruit_name, sizes.packaging_size,
            COALESCE(st.available_quantity, 0) AS available_quantity
     FROM fruits AS f
     CROSS JOIN (
       SELECT 'SMALL' AS packaging_size
       UNION ALL SELECT 'MEDIUM'
       UNION ALL SELECT 'LARGE'
     ) AS sizes
     LEFT JOIN stock AS st
       ON st.fruit_id = f.fruit_id
       AND st.packaging_size = sizes.packaging_size
     WHERE f.status = 'ACTIVE'
       AND COALESCE(st.available_quantity, 0) <= ?
     ORDER BY available_quantity, f.fruit_name,
       FIELD(sizes.packaging_size, 'SMALL', 'MEDIUM', 'LARGE')`,
    [threshold],
  )
  return rows
}

export async function ensureRow(connection, fruitId, packagingSize) {
  await connection.execute(
    `INSERT IGNORE INTO stock (fruit_id, packaging_size, available_quantity)
     VALUES (?, ?, 0)`,
    [fruitId, packagingSize],
  )
}

export async function findForUpdate(connection, fruitId, packagingSize) {
  const [rows] = await connection.execute(
    `SELECT available_quantity
     FROM stock
     WHERE fruit_id = ? AND packaging_size = ?
     FOR UPDATE`,
    [fruitId, packagingSize],
  )
  return rows[0]?.available_quantity ?? null
}

export async function adjust(connection, fruitId, packagingSize, delta) {
  const [result] = await connection.execute(
    `UPDATE stock
     SET available_quantity = available_quantity + ?
     WHERE fruit_id = ? AND packaging_size = ?
       AND available_quantity + ? >= 0`,
    [delta, fruitId, packagingSize, delta],
  )
  return result.affectedRows > 0
}


export async function findAll(connection) {
  const [rows] = await connection.execute(
    `SELECT f.fruit_id, f.fruit_name, f.description, f.status, f.created_at,
            p.packaging_size, p.unit_price
     FROM fruits AS f
     LEFT JOIN fruit_prices AS p ON p.fruit_id = f.fruit_id
     ORDER BY f.fruit_name, FIELD(p.packaging_size, 'SMALL', 'MEDIUM', 'LARGE')`,
  )
  return rows
}

export async function findById(connection, fruitId) {
  const [rows] = await connection.execute(
    `SELECT f.fruit_id, f.fruit_name, f.description, f.status, f.created_at,
            p.packaging_size, p.unit_price
     FROM fruits AS f
     LEFT JOIN fruit_prices AS p ON p.fruit_id = f.fruit_id
     WHERE f.fruit_id = ?
     ORDER BY FIELD(p.packaging_size, 'SMALL', 'MEDIUM', 'LARGE')`,
    [fruitId],
  )
  return rows
}

export async function create(connection, fruit) {
  const [result] = await connection.execute(
    `INSERT INTO fruits (fruit_name, description, status)
     VALUES (?, ?, ?)`,
    [fruit.fruitName, fruit.description, fruit.status],
  )
  return result.insertId
}

export async function insertPrices(connection, fruitId, prices) {
  for (const price of prices) {
    await connection.execute(
      `INSERT INTO fruit_prices (fruit_id, packaging_size, unit_price)
       VALUES (?, ?, ?)`,
      [fruitId, price.packagingSize, price.unitPrice],
    )
  }
}

export async function update(connection, fruitId, fruit) {
  const [result] = await connection.execute(
    `UPDATE fruits
     SET fruit_name = ?, description = ?, status = ?
     WHERE fruit_id = ?`,
    [fruit.fruitName, fruit.description, fruit.status, fruitId],
  )
  return result.affectedRows > 0
}

export async function updatePrices(connection, fruitId, prices) {
  for (const price of prices) {
    await connection.execute(
      `INSERT INTO fruit_prices (fruit_id, packaging_size, unit_price)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE unit_price = VALUES(unit_price)`,
      [fruitId, price.packagingSize, price.unitPrice],
    )
  }
}

export async function findPrice(connection, fruitId, packagingSize) {
  const [rows] = await connection.execute(
    `SELECT unit_price
     FROM fruit_prices
     WHERE fruit_id = ? AND packaging_size = ?`,
    [fruitId, packagingSize],
  )
  return rows[0]?.unit_price ?? null
}

export async function hasTransactions(connection, fruitId) {
  const [rows] = await connection.execute(
    `SELECT
       EXISTS(SELECT 1 FROM purchase_details WHERE fruit_id = ?) AS has_purchase,
       EXISTS(SELECT 1 FROM sales_details WHERE fruit_id = ?) AS has_sale`,
    [fruitId, fruitId],
  )
  return Boolean(rows[0]?.has_purchase || rows[0]?.has_sale)
}

export async function remove(connection, fruitId) {
  const [result] = await connection.execute(
    'DELETE FROM fruits WHERE fruit_id = ?',
    [fruitId],
  )
  return result.affectedRows > 0
}


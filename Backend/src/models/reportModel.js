export async function topSellingFruits(connection) {
  const [rows] = await connection.execute(
    `SELECT f.fruit_id, f.fruit_name, SUM(sd.quantity) AS boxes_sold
     FROM sales_details AS sd
     JOIN fruits AS f ON f.fruit_id = sd.fruit_id
     GROUP BY f.fruit_id, f.fruit_name
     ORDER BY boxes_sold DESC, f.fruit_name ASC
     LIMIT 5`,
  )
  return rows
}

export async function salesRevenue(connection, fromDate, toDate) {
  const [rows] = await connection.execute(
    `SELECT COALESCE(SUM(total_amount), 0.00) AS sales_revenue
     FROM sales
     WHERE sale_date >= ?
       AND sale_date < DATE_ADD(?, INTERVAL 1 DAY)`,
    [fromDate, toDate],
  )
  return rows[0]
}

export async function topVendor(connection) {
  const [rows] = await connection.execute(
    `SELECT v.vendor_id, v.vendor_name, SUM(sd.quantity) AS boxes_purchased
     FROM sales AS s
     JOIN vendors AS v ON v.vendor_id = s.vendor_id
     JOIN sales_details AS sd ON sd.sale_id = s.sale_id
     GROUP BY v.vendor_id, v.vendor_name
     ORDER BY boxes_purchased DESC, v.vendor_name ASC
     LIMIT 1`,
  )
  return rows[0] ?? null
}

export async function salesByDistrict(connection) {
  const [rows] = await connection.execute(
    `SELECT districts.district,
            COALESCE(summary.registered_vendors, 0) AS registered_vendors,
            COALESCE(summary.sales_count, 0) AS sales_count,
            COALESCE(summary.boxes_sold, 0) AS boxes_sold,
            COALESCE(summary.sales_revenue, 0.00) AS sales_revenue
     FROM (
       SELECT 'Berea' AS district
       UNION ALL SELECT 'Butha-Buthe'
       UNION ALL SELECT 'Leribe'
       UNION ALL SELECT 'Mafeteng'
       UNION ALL SELECT 'Maseru'
       UNION ALL SELECT 'Mohale''s Hoek'
       UNION ALL SELECT 'Mokhotlong'
       UNION ALL SELECT 'Qacha''s Nek'
       UNION ALL SELECT 'Quthing'
       UNION ALL SELECT 'Thaba-Tseka'
     ) AS districts
     LEFT JOIN (
       SELECT vendors.district,
              COUNT(DISTINCT vendors.vendor_id) AS registered_vendors,
              COUNT(DISTINCT sales.sale_id) AS sales_count,
              SUM(COALESCE(details.boxes_sold, 0)) AS boxes_sold,
              SUM(COALESCE(sales.total_amount, 0.00)) AS sales_revenue
       FROM vendors
       LEFT JOIN sales ON sales.vendor_id = vendors.vendor_id
       LEFT JOIN (
         SELECT sale_id, SUM(quantity) AS boxes_sold
         FROM sales_details
         GROUP BY sale_id
       ) AS details ON details.sale_id = sales.sale_id
       GROUP BY vendors.district
     ) AS summary ON summary.district = districts.district
     ORDER BY districts.district`,
  )
  return rows
}


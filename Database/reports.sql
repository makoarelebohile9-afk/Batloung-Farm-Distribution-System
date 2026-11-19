USE batloung_farm_distribution;

-- Five most frequently sold fruit types, ranked by boxes sold.
SELECT
  f.fruit_id,
  f.fruit_name,
  SUM(sd.quantity) AS boxes_sold
FROM sales_details AS sd
JOIN fruits AS f ON f.fruit_id = sd.fruit_id
GROUP BY f.fruit_id, f.fruit_name
ORDER BY boxes_sold DESC, f.fruit_name ASC
LIMIT 5;

-- Set the requested inclusive date range before running the revenue query.
SET @from_date = '2026-11-01 00:00:00';
SET @to_date = '2026-11-30 23:59:59';

SELECT
  COALESCE(SUM(total_amount), 0.00) AS sales_revenue,
  @from_date AS from_date,
  @to_date AS to_date
FROM sales
WHERE sale_date >= @from_date
  AND sale_date <= @to_date;

-- Vendor who has purchased the highest number of boxes.
SELECT
  v.vendor_id,
  v.vendor_name,
  SUM(sd.quantity) AS boxes_purchased
FROM sales AS s
JOIN vendors AS v ON v.vendor_id = s.vendor_id
JOIN sales_details AS sd ON sd.sale_id = s.sale_id
GROUP BY v.vendor_id, v.vendor_name
ORDER BY boxes_purchased DESC, v.vendor_name ASC
LIMIT 1;

-- One row for every fruit and packaging size, including zero-stock items.
SELECT
  f.fruit_id,
  f.fruit_name,
  sizes.packaging_size,
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
ORDER BY f.fruit_name, sizes.packaging_size;

-- Vendor and sales coverage for every district in Lesotho.
SELECT
  districts.district,
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
  SELECT
    vendors.district,
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
ORDER BY districts.district;


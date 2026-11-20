
INSERT INTO suppliers
  (supplier_id, business_name, contact_person, phone, province, address)
VALUES
  (1, 'Highveld Fresh Produce', 'Thabo Mokoena', '+27 11 555 0101', 'Gauteng', 'Johannesburg Fresh Produce Market'),
  (2, 'Cape Orchard Co-operative', 'Lerato Ndlovu', '+27 21 555 0102', 'Western Cape', 'Cape Town Market, Epping'),
  (3, 'Free State Fruit Growers', 'Mpho Dlamini', '+27 51 555 0103', 'Free State', 'Bloemfontein Produce Exchange')
ON DUPLICATE KEY UPDATE
  business_name = VALUES(business_name),
  contact_person = VALUES(contact_person),
  province = VALUES(province),
  address = VALUES(address);

INSERT INTO fruits (fruit_id, fruit_name, description, status)
VALUES
  (1, 'Apples', 'Fresh seasonal apples sourced from South African orchards.', 'ACTIVE'),
  (2, 'Bananas', 'Ripe bananas suitable for retail and street vending.', 'ACTIVE'),
  (3, 'Oranges', 'Juicy citrus oranges.', 'ACTIVE'),
  (4, 'Mangoes', 'Seasonal fresh mangoes.', 'ACTIVE'),
  (5, 'Grapes', 'Table grapes packed for resale.', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  status = VALUES(status);

INSERT INTO fruit_prices (fruit_id, packaging_size, unit_price)
VALUES
  (1, 'SMALL', 120.00), (1, 'MEDIUM', 220.00), (1, 'LARGE', 360.00),
  (2, 'SMALL', 100.00), (2, 'MEDIUM', 190.00), (2, 'LARGE', 320.00),
  (3, 'SMALL', 110.00), (3, 'MEDIUM', 205.00), (3, 'LARGE', 340.00),
  (4, 'SMALL', 150.00), (4, 'MEDIUM', 275.00), (4, 'LARGE', 450.00),
  (5, 'SMALL', 170.00), (5, 'MEDIUM', 310.00), (5, 'LARGE', 520.00)
ON DUPLICATE KEY UPDATE unit_price = VALUES(unit_price);

INSERT INTO vendors
  (vendor_id, vendor_name, phone_number, district, location, registration_date)
VALUES
  (1, 'Maseru Main Market Stall 14', '+266 5000 1001', 'Maseru', 'Maseru Central Market', '2026-01-15'),
  (2, 'Leribe Street Traders', '+266 5000 1002', 'Leribe', 'Hlotse Trading Area', '2026-02-02'),
  (3, 'Mafeteng Fresh Corner', '+266 5000 1003', 'Mafeteng', 'Mafeteng Town Centre', '2026-02-18')
ON DUPLICATE KEY UPDATE
  vendor_name = VALUES(vendor_name),
  district = VALUES(district),
  location = VALUES(location);

INSERT INTO purchases (purchase_id, supplier_id, purchase_date, total_amount)
VALUES
  (1, 1, '2026-11-01 08:00:00', 9380.00),
  (2, 2, '2026-11-05 09:30:00', 5800.00),
  (3, 3, '2026-11-10 07:45:00', 3400.00)
ON DUPLICATE KEY UPDATE
  supplier_id = VALUES(supplier_id),
  purchase_date = VALUES(purchase_date),
  total_amount = VALUES(total_amount);

INSERT INTO purchase_details
  (purchase_detail_id, purchase_id, fruit_id, quantity, unit_cost, packaging_size)
VALUES
  (1, 1, 1, 20, 85.00, 'SMALL'),
  (2, 1, 1, 10, 160.00, 'MEDIUM'),
  (3, 1, 1, 18, 260.00, 'LARGE'),
  (4, 1, 2, 20, 70.00, 'SMALL'),
  (5, 2, 3, 20, 75.00, 'MEDIUM'),
  (6, 2, 3, 10, 130.00, 'LARGE'),
  (7, 2, 5, 10, 300.00, 'LARGE'),
  (8, 3, 4, 20, 100.00, 'SMALL'),
  (9, 3, 2, 20, 70.00, 'MEDIUM')
ON DUPLICATE KEY UPDATE
  quantity = VALUES(quantity),
  unit_cost = VALUES(unit_cost),
  packaging_size = VALUES(packaging_size);

INSERT INTO stock (fruit_id, packaging_size, available_quantity)
VALUES
  (1, 'SMALL', 15), (1, 'MEDIUM', 8), (1, 'LARGE', 6),
  (2, 'SMALL', 16), (2, 'MEDIUM', 17), (2, 'LARGE', 0),
  (3, 'SMALL', 0), (3, 'MEDIUM', 12), (3, 'LARGE', 8),
  (4, 'SMALL', 19), (4, 'MEDIUM', 0), (4, 'LARGE', 0),
  (5, 'SMALL', 0), (5, 'MEDIUM', 0), (5, 'LARGE', 9)
ON DUPLICATE KEY UPDATE available_quantity = VALUES(available_quantity);

INSERT INTO sales (sale_id, vendor_id, sale_date, payment_status, total_amount)
VALUES
  (1, 1, '2026-11-03 10:15:00', 'PARTIALLY_PAID', 2160.00),
  (2, 2, '2026-11-07 11:20:00', 'PAID', 2990.00),
  (3, 1, '2026-11-12 13:05:00', 'UNPAID', 4170.00)
ON DUPLICATE KEY UPDATE
  vendor_id = VALUES(vendor_id),
  sale_date = VALUES(sale_date),
  payment_status = VALUES(payment_status),
  total_amount = VALUES(total_amount);

INSERT INTO sales_details
  (sales_detail_id, sale_id, fruit_id, packaging_size, quantity, unit_price)
VALUES
  (1, 1, 1, 'LARGE', 2, 360.00),
  (2, 1, 1, 'SMALL', 5, 120.00),
  (3, 1, 1, 'MEDIUM', 2, 220.00),
  (4, 1, 2, 'SMALL', 4, 100.00),
  (5, 2, 3, 'MEDIUM', 8, 205.00),
  (6, 2, 3, 'LARGE', 2, 340.00),
  (7, 2, 5, 'LARGE', 1, 520.00),
  (8, 2, 4, 'SMALL', 1, 150.00),
  (9, 3, 1, 'LARGE', 10, 360.00),
  (10, 3, 2, 'MEDIUM', 3, 190.00)
ON DUPLICATE KEY UPDATE
  quantity = VALUES(quantity),
  unit_price = VALUES(unit_price);

INSERT INTO payments (payment_id, sale_id, payment_method, amount, paid_at)
VALUES
  (1, 1, 'CASH', 1000.00, '2026-11-03 10:16:00'),
  (2, 2, 'MOBILE_MONEY', 2990.00, '2026-11-07 11:25:00'),
  (3, 3, 'CREDIT', 0.00, '2026-11-12 13:05:00')
ON DUPLICATE KEY UPDATE
  payment_method = VALUES(payment_method),
  amount = VALUES(amount),
  paid_at = VALUES(paid_at);

ALTER TABLE suppliers AUTO_INCREMENT = 4;
ALTER TABLE fruits AUTO_INCREMENT = 6;
ALTER TABLE vendors AUTO_INCREMENT = 4;
ALTER TABLE purchases AUTO_INCREMENT = 4;
ALTER TABLE purchase_details AUTO_INCREMENT = 10;
ALTER TABLE sales AUTO_INCREMENT = 4;
ALTER TABLE sales_details AUTO_INCREMENT = 11;
ALTER TABLE payments AUTO_INCREMENT = 4;


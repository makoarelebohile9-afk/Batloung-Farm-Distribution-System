CREATE DATABASE IF NOT EXISTS batloung_farm_distribution
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(120) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  province ENUM(
    'Gauteng',
    'Free State',
    'KwaZulu-Natal',
    'Western Cape',
    'Eastern Cape',
    'Limpopo',
    'Mpumalanga',
    'North West'
  ) NOT NULL,
  address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (supplier_id),
  UNIQUE KEY uq_suppliers_phone (phone)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fruits (
  fruit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  fruit_name VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (fruit_id),
  UNIQUE KEY uq_fruits_name (fruit_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fruit_prices (
  fruit_id BIGINT UNSIGNED NOT NULL,
  packaging_size ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL,
  unit_price DECIMAL(12, 2) UNSIGNED NOT NULL,
  PRIMARY KEY (fruit_id, packaging_size),
  CONSTRAINT chk_fruit_prices_positive CHECK (unit_price > 0),
  CONSTRAINT fk_fruit_prices_fruit
    FOREIGN KEY (fruit_id) REFERENCES fruits (fruit_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vendors (
  vendor_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_name VARCHAR(150) NOT NULL,
  phone_number VARCHAR(32) NOT NULL,
  district ENUM(
    'Berea',
    'Butha-Buthe',
    'Leribe',
    'Mafeteng',
    'Maseru',
    'Mohale''s Hoek',
    'Mokhotlong',
    'Qacha''s Nek',
    'Quthing',
    'Thaba-Tseka'
  ) NOT NULL,
  location VARCHAR(255) NOT NULL,
  registration_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (vendor_id),
  UNIQUE KEY uq_vendors_phone (phone_number),
  KEY idx_vendors_name (vendor_name),
  KEY idx_vendors_district (district)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchases (
  purchase_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  supplier_id BIGINT UNSIGNED NOT NULL,
  purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(12, 2) UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (purchase_id),
  KEY idx_purchases_supplier_date (supplier_id, purchase_date),
  CONSTRAINT chk_purchases_total_nonnegative CHECK (total_amount >= 0),
  CONSTRAINT fk_purchases_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers (supplier_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_details (
  purchase_detail_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  purchase_id BIGINT UNSIGNED NOT NULL,
  fruit_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_cost DECIMAL(12, 2) UNSIGNED NOT NULL,
  packaging_size ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL,
  PRIMARY KEY (purchase_detail_id),
  KEY idx_purchase_details_purchase (purchase_id),
  KEY idx_purchase_details_fruit (fruit_id),
  CONSTRAINT chk_purchase_details_quantity CHECK (quantity > 0),
  CONSTRAINT chk_purchase_details_unit_cost CHECK (unit_cost > 0),
  CONSTRAINT fk_purchase_details_purchase
    FOREIGN KEY (purchase_id) REFERENCES purchases (purchase_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_purchase_details_fruit
    FOREIGN KEY (fruit_id) REFERENCES fruits (fruit_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales (
  sale_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendor_id BIGINT UNSIGNED NOT NULL,
  sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_status ENUM('PAID', 'PARTIALLY_PAID', 'UNPAID') NOT NULL DEFAULT 'UNPAID',
  total_amount DECIMAL(12, 2) UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sale_id),
  KEY idx_sales_vendor_date (vendor_id, sale_date),
  KEY idx_sales_date (sale_date),
  CONSTRAINT chk_sales_total_nonnegative CHECK (total_amount >= 0),
  CONSTRAINT fk_sales_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors (vendor_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales_details (
  sales_detail_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sale_id BIGINT UNSIGNED NOT NULL,
  fruit_id BIGINT UNSIGNED NOT NULL,
  packaging_size ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(12, 2) UNSIGNED NOT NULL,
  PRIMARY KEY (sales_detail_id),
  KEY idx_sales_details_sale (sale_id),
  KEY idx_sales_details_fruit (fruit_id),
  CONSTRAINT chk_sales_details_quantity CHECK (quantity > 0),
  CONSTRAINT chk_sales_details_unit_price CHECK (unit_price > 0),
  CONSTRAINT fk_sales_details_sale
    FOREIGN KEY (sale_id) REFERENCES sales (sale_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sales_details_fruit
    FOREIGN KEY (fruit_id) REFERENCES fruits (fruit_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock (
  stock_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  fruit_id BIGINT UNSIGNED NOT NULL,
  packaging_size ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL,
  available_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (stock_id),
  UNIQUE KEY uq_stock_fruit_packaging (fruit_id, packaging_size),
  CONSTRAINT chk_stock_quantity_nonnegative CHECK (available_quantity >= 0),
  CONSTRAINT fk_stock_fruit
    FOREIGN KEY (fruit_id) REFERENCES fruits (fruit_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  payment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sale_id BIGINT UNSIGNED NOT NULL,
  payment_method ENUM('CASH', 'MOBILE_MONEY', 'CREDIT') NOT NULL,
  amount DECIMAL(12, 2) UNSIGNED NOT NULL,
  paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (payment_id),
  KEY idx_payments_sale_date (sale_id, paid_at),
  CONSTRAINT chk_payment_amount CHECK (
    (payment_method = 'CREDIT' AND amount = 0)
    OR (payment_method IN ('CASH', 'MOBILE_MONEY') AND amount > 0)
  ),
  CONSTRAINT fk_payments_sale
    FOREIGN KEY (sale_id) REFERENCES sales (sale_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;


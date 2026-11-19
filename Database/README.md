# Database

Use MySQL 8.0.16 or later. Run `schema.sql` first and then `seed.sql` against
your local MySQL server. The schema creates `batloung_farm_distribution` and
all tables; the sample script inserts realistic suppliers, fruits and
packaging prices, vendors, purchases, sales, payments, and size-specific stock.

`reports.sql` contains the four standalone reporting queries required by the
assignment. It uses `@from_date` and `@to_date` session variables for the
date-range revenue report, and also includes a district distribution summary
for all ten districts in Lesotho.

The eight core assignment tables are `suppliers`, `fruits`, `vendors`,
`purchases`, `purchase_details`, `sales`, `sales_details`, and `stock`.
`fruit_prices` configures different prices for each fruit and package size;
`payments` records cash, mobile-money, and credit entries and supports
outstanding-balance calculations. Vendor records include one of Lesotho's ten
districts as well as a more specific market or trading-area location.


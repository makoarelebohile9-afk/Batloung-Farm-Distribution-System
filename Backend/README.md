# Batloung Farm Distribution API

The backend is a Node.js/Express REST API backed by MySQL 8.0.16 or later.
It implements the assignment requirements without a user interface.

## Setup

1. Copy `.env.example` to `.env` and set `DB_HOST`, `DB_PORT`, `DB_USER`,
   `DB_PASSWORD`, and `DB_NAME`. Credentials are read from the environment and
   are not committed.
2. Run `npm install` and `npm run db:setup` from this directory. The setup
   script creates the schema and inserts the sample data using the configured
   MySQL credentials.
3. Run `npm test` and `npm start`.
4. The API listens on port `3000` by default. `GET /api/health` reports
   database availability. If MySQL is unavailable at startup, the API keeps
   running and returns an explicit `503` from the health endpoint; database
   query errors are returned as meaningful `500` responses.

Optional `CORS_ORIGIN` may contain a comma-separated list of allowed origins.

## API routes

All responses use JSON except successful deletes (`204 No Content`).

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/api/suppliers` | List or register suppliers |
| GET, PUT, DELETE | `/api/suppliers/:supplierId` | Retrieve, update, or delete a supplier; deletion is blocked when purchase history exists |
| GET, POST | `/api/fruits` | List or register fruits and all three prices |
| GET, PUT, DELETE | `/api/fruits/:fruitId` | Retrieve, update (including optional prices), or delete a fruit; history prevents deletion |
| GET | `/api/stock` | Current quantities for every active fruit and package size |
| GET | `/api/stock/low?threshold=10` | Stock at or below the requested threshold |
| GET, POST | `/api/vendors` | List/search or register vendors; use `?search=` for name/phone and `?district=` for a Lesotho district |
| GET, PUT | `/api/vendors/:vendorId` | Retrieve or update a vendor |
| GET | `/api/vendors/:vendorId/balance` | Sales, payments, and outstanding balance |
| GET, POST | `/api/purchases` | List or record purchases |
| GET | `/api/purchases/:purchaseId` | Retrieve a purchase and its items |
| GET, POST | `/api/sales` | List or record sales; optional `?vendorId=` filter |
| GET | `/api/sales/:saleId` | Retrieve a sale and its items |
| GET, POST | `/api/payments` | List all payments or filter by `?vendorId=`; record a payment |
| GET | `/api/reports/top-selling-fruits` | Five most frequently sold fruits |
| GET | `/api/reports/sales-revenue?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD` | Inclusive date-range sales revenue |
| GET | `/api/reports/top-vendor` | Vendor with the most boxes purchased |
| GET | `/api/reports/sales-by-district` | Vendor counts, sales, boxes, and revenue for all ten Lesotho districts |

### Example payloads

Register a fruit (prices must be different per package size):

```json
{
  "fruitName": "Pears",
  "description": "Fresh local pears",
  "sellingPrices": {
    "SMALL": 100,
    "MEDIUM": 180,
    "LARGE": 300
  }
}
```

Register a vendor in a Lesotho district:

```json
{
  "vendorName": "Maseru Market Stall 14",
  "phoneNumber": "+266 5000 1001",
  "district": "Maseru",
  "location": "Maseru Central Market"
}
```

Vendor districts are restricted to Berea, Butha-Buthe, Leribe, Mafeteng,
Maseru, Mohale's Hoek, Mokhotlong, Qacha's Nek, Quthing, and Thaba-Tseka.
Vendor list responses include the outstanding amount alongside total sales and
payments. Monetary values are stored as decimal amounts and are treated as
Maloti (M) by the frontend.

Record a multi-item purchase:

```json
{
  "supplierId": 1,
  "items": [
    {
      "fruitId": 1,
      "packagingSize": "SMALL",
      "quantity": 12,
      "unitCost": 80
    },
    {
      "fruitId": 2,
      "packagingSize": "LARGE",
      "quantity": 4,
      "unitCost": 250
    }
  ]
}
```

Record a sale on credit (the API resolves the configured prices and calculates
the total):

```json
{
  "vendorId": 1,
  "paymentMethod": "CREDIT",
  "items": [
    { "fruitId": 1, "packagingSize": "LARGE", "quantity": 2 },
    { "fruitId": 2, "packagingSize": "SMALL", "quantity": 3 }
  ]
}
```

`paymentMethod` accepts `CASH`, `MOBILE_MONEY`, or `CREDIT`. For a partial
upfront payment, pass `paidAmount` with `CASH` or `MOBILE_MONEY`; otherwise
those methods pay the full calculated total. Later payments use:

```json
{
  "saleId": 1,
  "paymentMethod": "MOBILE_MONEY",
  "amount": 100
}
```

## Data integrity

Each stock balance is keyed by fruit and `SMALL`, `MEDIUM`, or `LARGE`
packaging. Purchases increase stock and sales lock all required stock rows,
validate the complete order, and update the sale, details, payment, and stock
inside one MySQL transaction. Any invalid item or shortage rolls back all
changes. Sale totals use integer cents internally and are calculated from
price snapshots, so later price edits do not change historical sales.

The initial sample data includes six large apple boxes in stock to demonstrate
that a request for ten boxes is rejected without creating a sale or changing
stock. Reporting SQL is also available in `../Database/reports.sql`.


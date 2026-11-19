# Batloung Farm Distribution System

This repository contains the MySQL database, Express REST API, and a React
operations workspace for the DIWA2110 take-home test.

## Project layout

- `Backend/` — Express API, MySQL configuration, routes, controllers, models,
  middleware, business logic, and tests.
- `Database/` — MySQL schema, sample data, and reporting queries.
- `Frontend/` — responsive management pages connected to the REST API.

## Run locally

1. Install MySQL 8.0.16 or later. Copy `Backend/.env.example` to
   `Backend/.env` and enter your local MySQL credentials.
2. From `Backend`, run `npm install`, `npm run db:setup`, `npm test`, and
   `npm start`.
3. From `Frontend`, run `npm install`, `npm test`, and `npm run dev`.
4. The API listens at `http://localhost:3000`; `GET /api/health` checks the
   service and database connection. The Vite development server proxies `/api`
   requests to this API.

See [Backend/README.md](./Backend/README.md) for API routes, payloads, and
transaction behavior.


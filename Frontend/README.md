# Batloung Farm frontend

The React/Vite application provides a responsive operations workspace for the
assignment: suppliers, fruits and prices, size-specific stock, vendors across
Lesotho districts, purchases, sales, payments, and reports. All data is read
from the Express API; the browser does not use mock or seeded frontend data.

## Run locally

1. Start the backend from `../Backend` with `npm start`.
2. Copy `.env.example` to `.env` if you need to override the API URL. For local
   development, `/api` is proxied to `http://localhost:3000`.
3. Run `npm install`, `npm test`, and `npm run dev` from this folder.
4. Open the Vite URL printed in the terminal.

Run `npm run build` to create the production bundle. The Vite development
server can be deployed behind a reverse proxy that routes `/api` to the
backend, or configured with `VITE_API_BASE_URL` for another API origin.


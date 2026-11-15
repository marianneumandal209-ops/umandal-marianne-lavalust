# MindoroPay frontend

React/Vite frontend for the MindoroPay PHP API.

## Run locally

1. Start the PHP backend and configure its database connection using the `DB_DRIVER`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` environment variables.
2. Ensure the `queue_tickets` table has the `taxpayer_name` column. The guarded migration is `app/migrations/003_add_queue_ticket_taxpayer_name.php`.
3. From this directory, install dependencies and start Vite:

   ```sh
   npm install
   npm run dev
   ```

The default API URL is `http://localhost/mindoropay-backend/public/api`. To use another backend URL, set `VITE_API_BASE_URL` in a Vite environment file. The backend CORS configuration must allow the frontend origin; the default development origin is `http://localhost:5173`. Session cookies are used for authentication, so API requests include credentials.

## Connected workflows

- Registration, login, logout, session checks, and taxpayer profile read/update
- Admin user listing
- Admin-only `/api/tax_rates` demo endpoint for the Tax Rates & Fee Config tab; rates are intentionally unconfigured placeholders and are not used in payment calculations
- Taxpayer queue-ticket creation and taxpayer-owned transaction history
- Admin/cashier all-transaction and queue-ticket views
- Cashier queue status updates and payment recording
- Taxpayer payment-record creation and CSV export of loaded admin transactions

Payment submissions currently save records only; no money is charged. The backend does not currently provide a payment gateway, password-reset email delivery, assessment API, audit-log API, PDF reports, or a blockchain ledger/hash verification. The tax-rate endpoint is a demo configuration only; replace it with officially approved rates before using it for calculation or collection.

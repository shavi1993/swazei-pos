# Swazei POS — Senior Backend Engineer Take-Home

A NestJS + TypeScript + PostgreSQL take-home implementation starter for a multi-tenant point-of-sale API. Includes Prisma schema/migrations workflow, JWT login, merchant-scoped products/stores/inventory, transactional sale flow, mock payment, idempotency keys, Swagger, and a Docker Compose setup for PostgreSQL/Redis.

## Prerequisites
- Node.js 20+ (Node 22 LTS recommended)
- npm
- Docker Desktop (recommended) OR PostgreSQL installed locally
- Git

## Start locally (recommended: Docker Desktop)
**Windows quick setup:** install Node.js LTS and Docker Desktop, open Docker Desktop, then double-click `setup-windows.bat`. It creates `.env`, starts PostgreSQL/Redis, installs packages, generates Prisma Client, runs migrations and seeds sample data. If any step fails, read the displayed error and follow the manual steps below.

1. Copy `.env.example` to `.env` and set a strong `JWT_SECRET`. If using Docker Compose as provided, the database URL is `postgresql://postgres:postgres@localhost:5432/swazei_pos?schema=public`.
2. Start services: `docker compose up -d` (Docker Desktop must be running).
3. Install dependencies: `npm install`.
4. Generate Prisma client: `npx prisma generate`.
5. Create tables: `npx prisma migrate dev --name init`.
6. Seed demo data: `npm run db:seed`.
7. Start app: `npm run start:dev`.
8. Swagger docs: http://localhost:3000/api/docs

If PostgreSQL is installed directly, change `DATABASE_URL` to match your local username/password and create the `swazei_pos` database first. Redis is used for best-effort merchant-scoped product-list caching; if Redis is unavailable, the API falls back to PostgreSQL.

## Demo login
- Email: `owner@example.com`
- Password: `DemoPass123!`
Change/remove this seed account before deploying anywhere public. Do not commit real credentials.

## Useful API flow
All endpoints are under `/api`.
1. `POST /api/auth/login` body: `{ "email": "owner@example.com", "password": "DemoPass123!" }`
2. Copy `accessToken` into Swagger's Authorize button as a Bearer token.
3. `GET /api/stores` to get the demo store ID.
4. `GET /api/products` to get product IDs.
5. `GET /api/stores/{storeId}/inventory` to see stock.
6. `POST /api/stores/{storeId}/sales` with header `Idempotency-Key: demo-sale-0001` and body `{ "items": [{ "productId": "<product-id>", "quantity": 2 }] }`.
7. To simulate a failed payment, set `simulatePaymentFailure: true` in the request body. The request will return a recorded failed sale and inventory changes are rolled back.

Create product body: `{ "name": "Juice", "sku": "JUICE-001", "priceCents": 450 }`. Prices are represented as integer minor units (e.g. 450 = 4.50 in a two-decimal currency); choose a single currency convention for a real deployment.

## Design decisions
- **Tenant isolation:** JWT payload includes merchantId; all product queries are scoped to it. Store and inventory/sale access verifies store ownership using the merchantId from the token, never a merchant ID sent by the client.
- **Database:** Merchant → stores/products/users; store-level inventory unique on `(storeId, productId)`; sale items preserve unit price at time of purchase; product SKU unique within merchant.
- **Transactions/concurrency:** inventory decrement uses a conditional update (`quantity >= requested quantity`) inside a serializable transaction. If any line cannot be deducted, the transaction rolls back. Serializable conflicts return 409 so the client can retry with the same idempotency key.
- **Idempotency:** require `Idempotency-Key`; uniqueness on `(storeId, idempotencyKey)`; request hash detects key reuse with a different body. Duplicate successful requests return the original result.
- **Payments:** mock provider is injected separately from sales logic. This take-home simulation calls the mock provider inside the transaction; a production external payment provider should use authorization/capture and a recovery/reconciliation flow rather than holding a database transaction open across network calls.
- **Caching:** product lists are cached in Redis for 60 seconds, scoped by merchant. Product creation invalidates the merchant cache. Cache errors fall back to PostgreSQL; do not cache inventory or use cache data to authorize requests.
- **Validation/errors:** global DTO validation rejects unknown fields; errors use NestJS HTTP exceptions.

## Tests
Run `npm test`. Add/extend integration tests using a dedicated test PostgreSQL database for successful and failed payment, insufficient inventory, cross-tenant access, duplicate idempotency requests, and (bonus) concurrent sales. Do not run destructive test cleanup against production data.

## Important verification notes before submitting
This is a runnable implementation starter, not a guarantee of a fully accepted or production-ready submission. Run it on your computer and fix any environment-specific issues. Expand the Jest suite to cover successful payment, failed payment, insufficient inventory, cross-tenant access, duplicate requests, and preferably concurrent sales. The included unit tests are only initial smoke tests and do not replace those required scenario tests. Review role-specific permissions and payment recovery trade-offs before submission.

# Inventory Management System

Full-stack inventory management system: Node.js/Express + MongoDB (Mongoose) API, React (Vite) frontend, deployable to Vercel.

## Features
- Auth with JWT + role-based access (`superadmin`, `storekeeper`, `salesperson`)
- Products, Categories, Suppliers
- Stock ledger (`StockMovement`) — every quantity change is tracked, never mutated directly
- Purchase Orders with partial/full receiving that drives stock-in movements
- Sales Orders with fulfillment that drives stock-out movements
- Low-stock report, stock valuation report
- Dashboard with key metrics and recent activity chart

## Project structure
```
/                       backend (Express API)
  Config/               DB connection
  Controllers/          route handlers
  Middleware/           auth + RBAC
  Models/                Mongoose schemas
  Routes/                Express routers
  Scripts/seedAdmin.js   creates the first superadmin
  api/index.js           Vercel serverless entry point
  vercel.json             Vercel routing config
/client                  frontend (React + Vite + Tailwind)
```

## Backend setup
```bash
npm install
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET
node Scripts/seedAdmin.js   # creates the first superadmin (see .env for credentials)
npm run dev
```
API runs on `http://localhost:5000` by default. `/health` returns `{ status: "ok" }` once it's up.

`/users/createuser` requires an existing superadmin token — after seeding, log in as the seeded admin and use that endpoint to create the rest of your team with the appropriate roles.

## Frontend setup
```bash
cd client
npm install
cp .env.example .env   # set VITE_API_URL to your backend URL
npm run dev
```
Runs on `http://localhost:5173`.

## Deploying (Vercel, serverless)

**Backend**
1. Push this repo to GitHub, import it into Vercel.
2. Vercel will use `vercel.json` / `api/index.js` automatically — no code changes needed.
3. Set environment variables in the Vercel dashboard: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`.
4. Use a serverless-friendly MongoDB — MongoDB Atlas works fine; just make sure your Atlas IP access list allows `0.0.0.0/0` (Vercel's IPs are dynamic) or use Atlas's Vercel integration.
5. Run `node Scripts/seedAdmin.js` once locally against your production `MONGODB_URI` to create the first admin (or run it as a one-off Vercel CLI function invocation).

**Frontend**
1. Import `/client` as a separate Vercel project (or configure it as a second app in the same repo).
2. Set `VITE_API_URL` to your deployed backend URL.
3. Update the backend's `CLIENT_URL` env var to match your deployed frontend URL (for CORS).

## Notes / things to decide as you extend this
- Currently single-location inventory (`Product.quantity` is a single number). If you need multiple warehouses, introduce a separate `StockItem` model keyed by `(product, warehouse)` and move `quantity` there — the `StockMovement` ledger pattern extends cleanly to that.
- `Product.sku` is required + unique. If you already have products in your database without SKUs, you'll need a migration to backfill them before this schema change takes effect.
- File/image upload for products isn't wired yet — plug in S3/Cloudflare R2 with presigned URLs when you get to it (see the original roadmap doc).

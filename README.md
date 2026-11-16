# IFIX Store

Full-stack IFIX electronics storefront and admin dashboard. This repository includes a reusable public product catalog and product photos for a fresh deployment.

## Fresh deployment

1. Install Node.js 20 or newer and PostgreSQL.
2. Create a new, empty PostgreSQL database.
3. Clone and install dependencies:

   ```sh
   git clone https://github.com/Shejaoli/ifix.git
   cd ifix
   npm install
   ```

4. Copy `.env.example` to `.env`, then set `DATABASE_URL`, a unique `SESSION_SECRET`, and your own `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`. The initial admin is created only if that email does not already exist; startup never resets an existing password. Keep `.env` private.
5. Apply the schema and start the app:

   ```sh
   npm run db:push
   npm run build
   npm start
   ```

   Put the app behind an HTTPS reverse proxy and point it at the deployment's domain or IP.

## Snapshot contents and privacy

The included catalog is reusable product data, `public/uploads/products/` contains the associated product images, and `data/site-currency.json` preserves the store display currency and rate for first startup. The database snapshot deliberately excludes customer accounts, order histories, admin accounts/password hashes, sessions, payment records, and other private operational data. Each new installation gets its own empty database and initial admin credentials. Runtime uploads, videos, environment files, build output, and database dumps are ignored by Git.

On an existing database, startup imports the catalog only when the products table is empty, and applies the saved currency setting only when no currency setting exists yet. Delivery fees, featured slides, home sections, coupons, reviews, and videos were empty in the source database.

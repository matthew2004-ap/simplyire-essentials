# Simplyire Essentials

A complete Next.js App Router ecommerce website starter for Simplyire Essentials.

## What is already included

- Responsive storefront
- Home, shop, product detail, about, services, journal/blog, contact, cart, FAQ, shipping, login, register and customer dashboard routes
- Reusable Navbar, Footer, ProductCard, Newsletter and ContactForm components
- SEO metadata
- Real photographic product/lifestyle imagery from Unsplash URLs
- Product filtering/search
- Dynamic product and blog routes
- Prisma PostgreSQL schema
- Contact, products, orders and health API routes
- `.env.example`
- Git-ready structure

## Run the frontend

```bash
npm install
npm run dev
```

Open http://localhost:3000

The UI and demo catalog work without a database. Contact/order endpoints need the backend setup.

## Backend setup

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env`.
3. Add `DATABASE_URL` and a strong `AUTH_SECRET`.
4. Install Prisma dependencies if needed:
   ```bash
   npm install
   ```
5. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
6. Create the database tables:
   ```bash
   npx prisma migrate dev --name init
   ```
7. Add authentication logic to `/api/auth/register` and `/api/auth/login` (the UI routes are already present).
8. Connect a payment provider and implement checkout.
9. Replace placeholder contact details and social links.
10. Replace demo product records with database-backed catalog records.
11. Add admin authorization and an admin dashboard before launch.

## Production

```bash
npm run build
npm start
```

For Vercel, connect the GitHub repository, add the production environment variables, and deploy.

## Important before launch

- Replace placeholder WhatsApp/email details.
- Confirm product pricing, inventory and delivery policy.
- Confirm payment gateway.
- Replace demo Unsplash imagery with the brand's own licensed product photos if available.
- Add privacy policy, terms and refund policy.
- Configure authentication and admin authorization.

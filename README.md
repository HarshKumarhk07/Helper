# Helper

A full-stack **urban home-services marketplace + e-commerce platform**. Customers can book on-demand professionals (cleaning, painting, repairs, car trips, and more), buy products, and pay online — while workers/brands onboard through KYC, receive job assignments, and track earnings. Admins manage the catalog, users, payouts, and support from a dedicated dashboard.

Built as a MERN application with real-time tracking, secure payments, and transactional email/SMS notifications.

---

## Tech Stack

**Frontend** (`client/`)
- React 18 + Vite
- Tailwind CSS + Framer Motion
- React Router
- Axios, Socket.IO client (live tracking / status)
- Leaflet + React-Leaflet (maps & routing)
- Chart.js (dashboards), Firebase (Google sign-in), Razorpay checkout

**Backend** (`server/`)
- Node.js + Express
- MongoDB + Mongoose
- JWT auth (access + refresh tokens), bcrypt
- Socket.IO (real-time worker tracking & job updates)
- Razorpay (payments), Cloudinary (media uploads)
- Brevo (transactional email), Twilio (SMS)
- PDFKit (invoice generation), Zod (validation), Helmet + rate limiting

---

## Features

- **Service bookings** — browse services by category, book a slot, live-track the assigned worker, and confirm start/end with 6-digit PINs.
- **E-commerce** — product catalog, cart, coupons, checkout, orders, and invoices.
- **Car trips** — drivers list trips; customers book seats (outbound/return).
- **Worker & brand onboarding** — KYC submission, admin review, availability management, earnings and payouts.
- **Payments** — Razorpay online payments with server-side verification and refunds; wallet support.
- **Notifications** — email (Brevo) + SMS (Twilio) for bookings, assignments, start/end, orders, KYC, and more.
- **Admin dashboard** — manage users, services, products, categories, coupons, payouts, support tickets, and audit logs.
- **Auth** — email/password + "Continue with Google" (Firebase), password reset, role-based access (user / worker / brand / admin).

---

## Project Structure

```
Helper/
├── client/            # React + Vite frontend
│   ├── src/
│   │   ├── pages/         # route pages (BookingFlow, CheckoutPage, dashboards, …)
│   │   ├── sections/      # landing/hero/service sections
│   │   ├── components/    # shared UI, layout, cards
│   │   ├── context/       # Auth, Cart, Favorites providers
│   │   └── api/           # axios API wrappers
│   └── .env.example
└── server/            # Express + MongoDB backend
    ├── src/
    │   ├── routes/        # REST endpoints (auth, booking, cart, order, payment, …)
    │   ├── controllers/   # request handlers
    │   ├── models/        # Mongoose schemas
    │   ├── utils/         # notifications, dispatch, sockets, helpers
    │   └── seed/          # database seeders
    └── .env.example
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & install

```bash
git clone https://github.com/HarshKumarhk07/Helper.git
cd Helper

# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 2. Configure environment variables

Copy the example files and fill in your values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

- **`server/.env`** — set at minimum `MONGO_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`. Payment/email/SMS/media keys (Razorpay, Brevo, Twilio, Cloudinary) are optional in development — the app degrades gracefully when they're missing.
- **`client/.env`** — optional in local dev (the Vite proxy forwards `/api` to `http://localhost:5000`). Set `VITE_API_URL` for deployed environments and the `VITE_FIREBASE_*` keys to enable Google sign-in.

### 3. Seed the database (optional)

```bash
cd server
npm run seed          # base data + admin account (see ADMIN_SEED_* in .env)
npm run add:categories
npm run add:services
```

### 4. Run

```bash
# Terminal 1 — backend (http://localhost:5000)
cd server && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client && npm run dev
```

Open **http://localhost:5173**.

---

## Available Scripts

**Backend (`server/`)**

| Script | Description |
| --- | --- |
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start in production mode |
| `npm run seed` | Seed base data + admin user |
| `npm run add:categories` / `add:services` | Seed catalog data |
| `npm run cleanup:catalog` | Remove seeded catalog data |
| `npm run test:slice-*` | Integration/validation test scripts |

**Frontend (`client/`)**

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |

---

## Deployment

- **Backend** runs as a Node web service (e.g. Render). Set all `server/.env` values as environment variables on the host, and point `CLIENT_URL` at the deployed frontend origin.
- **Frontend** builds to static assets (`npm run build`). Set `VITE_API_URL` to the deployed backend URL (no trailing slash, no `/api` suffix).
- For private-repo hosting, ensure the host's GitHub integration has access to the repository so pushes trigger deploys.

---

## Notes

- Environment files (`.env`) are gitignored — never commit secrets. Only `.env.example` templates are tracked.
- Roles: `user`, `worker`, `brand`, and `admin`. Only `user` accounts can book services / place orders.

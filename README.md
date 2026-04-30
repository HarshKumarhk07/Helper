# Velora House

Urban service & ecommerce platform — MERN stack.

- **Slice A: foundation** — design system, auth, RBAC, role dashboards, seed admin ✅
- **Slice B: services & bookings** — service catalog, instant + scheduled bookings, status state machine, manual + auto worker assignment ✅
- **Slice C: live tracking + PIN gating** — Socket.io + Leaflet (next)

```
velora-house/
├── client/          Vite + React + Tailwind (Chivo Mono, brand palette)
└── server/          Express + MongoDB + JWT + RBAC + zod validation
```

---

## 1. Prerequisites

- Node.js **18+** (20 recommended)
- npm **9+**
- A MongoDB instance — local (`mongodb://127.0.0.1:27017`) or MongoDB Atlas

---

## 2. Configure environment

### Backend — `server/.env`

A `server/.env` file is already created with empty values. Fill in:

```dotenv
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb://127.0.0.1:27017/velora_house

JWT_SECRET=<generate: openssl rand -hex 48>
JWT_REFRESH_SECRET=<generate: openssl rand -hex 48>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

BCRYPT_SALT_ROUNDS=10

ADMIN_SEED_EMAIL=admin@velora.house
ADMIN_SEED_PASSWORD=<choose a strong password>
ADMIN_SEED_NAME=Velora Admin

# Optional for later slices — leave blank for now
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### Frontend — `client/.env`

Optional. Defaults to proxying `/api` → `http://localhost:5000`. To override:

```dotenv
VITE_API_URL=http://localhost:5000
```

---

## 3. Install & run

Open **two terminals**.

**Terminal 1 — backend:**

```bash
cd server
npm install
npm run seed     # creates the admin user from .env (one-time)
npm run dev      # starts on http://localhost:5000
```

**Terminal 2 — frontend:**

```bash
cd client
npm install
npm run dev      # starts on http://localhost:5173
```

Open <http://localhost:5173>.

---

## 4. After running seed

Slice B's seed creates demo accounts you can log in with. **All demo accounts share the same password as `ADMIN_SEED_PASSWORD`** in your `.env`:

| Role | Email |
|---|---|
| Admin | `admin@velora.house` (or whatever `ADMIN_SEED_EMAIL` is) |
| Manager | `manager.demo@velora.house` |
| Worker | `worker.demo@velora.house` |

It also seeds 6 categories and ~17 services. Re-running `npm run seed` is idempotent — it skips anything already present.

---

## 5. What's in Slice A

### Design system
- Chivo Mono via Google Fonts
- Palette: `#18181A` ink · `#FDFDFD` paper · `#B8B8B9` ash · `#F6ECE4` sand
- Pill buttons, rounded cards, overlay info boxes, soft shadows
- Dark-mode toggle (`class` strategy)
- Fade-up scroll animations via `framer-motion` `whileInView`
- Skeleton loader primitive

### Landing page (`/`)
- Branding showcase (typography + color swatches — matches the Branding image)
- Hero: "THE URBAN SERVICE COLLECTION" with overlay info box
- Services grid (Cleaning / Plumbing / Electrical / Salon / Painting / Moving)
- Categories list with hover reveal + horizontal product strip
- Products grid (4-up)
- Philosophy three-pillar section with editorial image
- Worker tracking teaser (live ops preview for Slice C)

### Auth & RBAC
- `POST /api/auth/signup` — public, creates a `user` role
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET  /api/auth/me` (protected)
- `PATCH /api/users/me`
- `GET  /api/users` — admin / manager
- `POST /api/users` — admin only (creates worker / manager / admin / user)
- `PATCH /api/users/:id/active` — admin only

Tokens: JWT access + refresh (separate secrets, configurable expiry).
Passwords: bcrypt with configurable salt rounds.
Validation: `zod` per route.
Hardening: `helmet`, CORS, rate limit on `/api/auth`, structured error handler.

### Frontend routes

| Path | Access |
|---|---|
| `/` | Public landing |
| `/login`, `/signup` | Public |
| `/dashboard` | Auth — redirects by role |
| `/admin/*` | `admin` |
| `/manager/*` | `admin`, `manager` |
| `/worker/*` | `worker`, `admin` |
| `/me/*` | Any authenticated user |

`<ProtectedRoute>` enforces auth + role. `<RoleRedirect>` sends users to their role's home.

---

## 6. What's in Slice B

### Backend models
- **ServiceCategory** — `name`, `slug`, `icon`, `color`, `manager`, `isActive`, `sortOrder`
- **Service** — belongs to a category. `name`, `price`, `durationMinutes`, `image`, `rating`
- **Address** — per-user address book with default flag + lat/lng
- **Booking** — user, service, category, type (`instant` | `scheduled`), scheduled time, address snapshot, status, worker, start/end PINs (generated on create), payment mode/status, history log

### Status state machine

```
PLACED ─ assign ──> ASSIGNED ─ start ──> IN_PROGRESS ─ complete ──> COMPLETED
   │                   │
   └─── cancel ────────┴──> CANCELLED
```

Allowed actors per transition (enforced server-side):
- **assign** → admin / manager (or auto-assign on creation)
- **start** → worker / admin (Slice C will gate this with the start PIN)
- **complete** → worker / admin (Slice C will gate this with the end PIN)
- **cancel** → user (own booking) / admin / manager — only from `placed` or `assigned`

Auto-assign picks the active worker with the fewest in-flight bookings.

### REST endpoints (Slice B)

Categories — `GET /api/categories`, `GET /api/categories/:idOrSlug`. Admin-only: `POST | PATCH /:id | DELETE /:id`.

Services — `GET /api/services?category=&q=&active=true`, `GET /api/services/:id`. Admin/Manager: `POST | PATCH /:id | DELETE /:id`.

Addresses (auth required) — `GET | POST /api/addresses`, `PATCH | DELETE /api/addresses/:id`.

Bookings (auth required):
- `POST /api/bookings` — create instant or scheduled. Body: `{ service, type, scheduledAt?, addressId? | address?, paymentMode?, autoAssign?, notes? }`.
- `GET /api/bookings/mine` — my bookings (any role).
- `GET /api/bookings/worker/jobs` — worker's queue (worker / admin).
- `GET /api/bookings` — admin / manager — supports `status`, `worker`, `user`, `category` filters.
- `GET /api/bookings/:id` — owner / assigned worker / admin / manager only.
- `POST /api/bookings/:id/assign` (admin / manager) — body `{ workerId }`.
- `POST /api/bookings/:id/auto-assign` (admin / manager).
- `POST /api/bookings/:id/status` — body `{ to, note? }`.

### Frontend pages

| Path | Who | What |
|---|---|---|
| `/services` | Public | Catalog browser with category chips + search |
| `/services/:id` | Public | Service detail + Book CTA |
| `/book/:serviceId` | Auth | Booking flow — instant/scheduled, address picker, payment, auto-assign toggle |
| `/me/bookings` | User | My bookings with status filter + cancel |
| `/admin/bookings` | Admin | All bookings table — assign / auto-assign / cancel / complete |
| `/worker/jobs` | Worker | Job queue with start / complete actions |

---

## 7. Test the flow

**Slice A**
```
1. Sign up at /signup or log in with the seeded admin.
2. Top-right user icon → after login, "Sign out" pill appears.
3. /admin only renders for the admin; others bounce to /dashboard.
```

**Slice B end-to-end**
```
1. Open /services as a regular user — pick a service.
2. Hit "Book now" → fill the booking flow (address + slot + auto-assign on).
3. /me/bookings shows the booking with status "Assigned".
4. Log in as worker.demo@velora.house in another browser/tab → /worker/jobs
   shows the assigned job → "Start job" → "Mark complete".
5. Refresh /me/bookings as the user → status now "Completed".
6. Log in as admin → /admin/bookings shows the full table with controls.
```

Quick API check:

```bash
curl http://localhost:5000/api/health
# { "status": "ok", "service": "velora-house", ... }
```

---

## 8. What's next

| Slice | Scope |
|---|---|
| ~~**A**~~ | ~~Foundation~~ ✅ |
| ~~**B**~~ | ~~Service catalog, bookings, status machine, assignment~~ ✅ |
| **C** | Socket.io + Leaflet live tracking, `watchPosition` + throttled emit, PIN start/end gates |
| **D** | Products, cart, checkout, Razorpay + COD, order tracking |
| **E** | Chart.js admin dashboard, coupons, invoice PDFs, audit logs, Cloudinary |

When you're ready, say **"start Slice C"** and we'll layer real-time tracking and PIN gating on top.

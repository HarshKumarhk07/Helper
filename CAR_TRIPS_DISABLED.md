# Car Trips / Car Service — Disabled from UI

The **Car Trips** (a.k.a. Car Service) feature — workers list car trips, customers
book seats, admin approves driver KYC — has been **hidden from the UI** by commenting
out its entry points. All backend code, models, routes, and page components are left
intact so the feature can be restored later.

Search for the marker `[CAR-TRIPS DISABLED]` to find every commented block.

Date disabled: 2026-07-21

---

## What was commented out (UI entry points)

All of these are wrapped/prefixed with `[CAR-TRIPS DISABLED]`. To restore, uncomment.

| File | Lines (approx) | What |
|------|------|------|
| `client/src/App.jsx` | ~85–88 | Lazy imports: `WorkerCarService`, `AdminCarKycQueue`, `CarTripsBrowse`, `CustomerCarBookings` |
| `client/src/App.jsx` | ~158 | Route `/trips` → `CarTripsBrowse` |
| `client/src/App.jsx` | ~209 | Route `/admin/car-kyc` → `AdminCarKycQueue` |
| `client/src/App.jsx` | ~249 | Route `/worker/car-service` → `WorkerCarService` |
| `client/src/App.jsx` | ~259 | Route `/me/car-bookings` → `CustomerCarBookings` |
| `client/src/components/layout/Navbar.jsx` | ~20, ~31 | "Car Trips" links in `NAV` and `HERO_NAV` |
| `client/src/pages/dashboards/DashboardShell.jsx` | ~29, ~44, ~57 | Sidebar items: user "Car Bookings", worker "Car Service", admin "Car Service KYC" |
| `client/src/pages/dashboards/WorkerDashboard.jsx` | ~35 | "Car Service →" pill button |
| `client/src/pages/dashboards/AdminDashboard.jsx` | ~412 | "Car KYC approval →" pill button |

With these commented out, there is **no reachable UI path** into the feature: no nav
links, no dashboard tabs, no routes.

---

## Left intact (still exist, but now unreachable / dead code)

These files were **not** modified. They no longer have a route pointing at them, so
they never render, but the source remains for restoration:

- `client/src/pages/CarTripsBrowse.jsx`
- `client/src/pages/dashboards/WorkerCarService.jsx`
- `client/src/pages/dashboards/CustomerCarBookings.jsx`
- `client/src/pages/dashboards/AdminCarKycQueue.jsx`
- `client/src/api/carService.js`

### Backend (untouched — API still live but no UI calls it)

- `server/src/models/CarTrip.js`, `CarBooking.js`, `CarServiceKYC.js`
- `server/src/controllers/carServiceController.js`
- `server/src/routes/carService.routes.js`
- `server/src/app.js` → `app.use('/api/car-service', carServiceRoutes)` (line ~189)
- `server/src/utils/notificationService.js` → `notifyCarBookingPlaced`, `notifyCarBookingCancelled`, `notifyCarTripCancelled`
- Seed/verify scripts: `server/scripts/seedCarTrips.js`, `seedCatalogCarService.js`, `verifyCarService.js`

---

## ⚠️ Caveat — catalog "Car Trips" card (DB-driven)

If the catalog seed (`server/scripts/seedCatalogCarService.js`) was ever run, the DB
contains a **`car-trips` ServiceCategory and Service**. That data is rendered from the
database, so it can still appear as a "Car Trips" card/category in:

- `client/src/pages/ServicesIndex.jsx`
- `client/src/components/services/ServiceCard.jsx`
- `client/src/pages/ServiceDetail.jsx`
- `client/src/pages/CategoryDetail.jsx`
- the Navbar "Categories" dropdown

These files contain redirect logic that sends a `car-trips` slug to `/trips` (now a
dead route). They were **left as-is**. To fully hide the catalog entry, remove or
unpublish the `car-trips` category/service in the database (code changes alone won't
do it). Also note `server/src/controllers/serviceController.js` (~lines 87, 111)
attaches active trips to the car-trips catalog entry.

---

## How to restore

1. Search the codebase for `[CAR-TRIPS DISABLED]`.
2. Uncomment each marked block (imports, routes, nav items, pill buttons).
3. Backend never changed, so no server action needed.

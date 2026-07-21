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

## Catalog "Car Booking & Travel" card (DB-driven) — filtered client-side

The catalog seed (`server/scripts/seedCatalogCarService.js`) created a **`car-trips`
ServiceCategory and a `car-trips` Service ("Car Booking & Travel")** in the DB (the
service is currently re-parented under the "DRIVER" category). Because this is DB data,
commenting components wouldn't remove it — so it is filtered out **centrally in the API
wrappers**:

| File | What |
|------|------|
| `client/src/api/services.js` | `listServices` drops any service whose slug is in `HIDDEN_SERVICE_SLUGS` (`car-trips`) unless `{ includeHidden: true }` is passed |
| `client/src/api/categories.js` | `listCategories` drops any category whose slug is in `HIDDEN_CATEGORY_SLUGS` (`car-trips`) unless `{ includeHidden: true }` |

This hides the card/category from **every** public surface at once: services index,
Navbar categories dropdown + autocomplete, featured/discover sections, category tiles,
category detail, and the service modal.

**Admin still sees and can manage it** — these pages pass `includeHidden: true`:
- `client/src/pages/dashboards/AdminServices.jsx`
- `client/src/pages/dashboards/AdminCategories.jsx`

Direct-URL guards (for any saved/stale link) now bounce `car-trips` to `/services`
instead of the dead `/trips` route:
- `client/src/pages/ServiceDetail.jsx` (~line 171)
- `client/src/pages/CategoryDetail.jsx` (~line 17)

To restore the catalog card, remove the `HIDDEN_*_SLUGS` filters and revert the two
redirects. `server/src/controllers/serviceController.js` (~lines 87, 111) still attaches
active trips to the car-trips catalog entry — harmless while hidden.

> To remove the data entirely instead of hiding it, delete/unpublish the `car-trips`
> category and service in the database.

---

## How to restore

1. Search the codebase for `[CAR-TRIPS DISABLED]`.
2. Uncomment each marked block (imports, routes, nav items, pill buttons).
3. Backend never changed, so no server action needed.

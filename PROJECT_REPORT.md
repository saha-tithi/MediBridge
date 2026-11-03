# MediBridge — Project Report

**Report date:** 3 November 2026
**Repository:** `github.com/saha-tithi/MediBridge` · branch `main` · HEAD `da76b1d`
**Live site:** <https://medibridge-hd34.onrender.com>
**Working tree:** clean (no uncommitted changes)

---

## 1. Project Summary

MediBridge is a full-stack online pharmacy management platform. Customers browse and
search medicines, upload prescriptions, pay and track orders; pharmacists manage
inventory, verify prescriptions, process orders and receive notifications.

| Area | Value |
|---|---|
| Framework | Django 5.2.16 + Django REST Framework 3.17.1 |
| Database | PostgreSQL (Render managed, free) |
| Auth | SimpleJWT (30 min access / 7 day refresh, rotation + blacklist) |
| Frontend | Server-rendered Django templates + vanilla JavaScript (no build step) |
| Static files | WhiteNoise (`CompressedManifestStaticFilesStorage`) |
| Media | Cloudinary (custom storage backend) |
| Payments | Razorpay (**test** keys — no real money moves) |
| Email | Brevo HTTPS API in production, SMTP fallback locally |
| AI | Gemini cloud API (prescription OCR) + RapidFuzz (name matching) |
| Hosting | Render **free** tier, Oregon region |

### Scale

| Metric | Count |
|---|---|
| Git commits | 86 (1 contributor, 1 Aug – 2 Nov 2026) |
| Django apps | 10 (`accounts`, `addresses`, `ai_engine`, `cart`, `common`, `medicine`, `notifications`, `orders`, `pages`, `prescriptions`) + `config` |
| Models | 12 — `User`, `Address`, `Cart`, `CartItem`, `Category`, `Medicine`, `Inventory`, `Notification`, `NotificationRead`, `Order`, `OrderItem`, `Prescription` |
| Migrations | 14 |
| Routes | 77 — 41 API endpoints + 23 pages + 13 root includes |
| Templates / JS / CSS | 27 / 26 / 26 |
| Lines of code | 31,912 — Python 5,695 · JS 10,575 · CSS 11,156 · HTML 4,486 |
| Repository size | 2.3 MB (excl. `venv/`, `media/`, `staticfiles/`) |

---

## 2. Development Timeline

### Phase 1 — Build (1 Aug – 6 Oct 2026, 64 commits)

| Dates | Delivered |
|---|---|
| 1–7 Aug | Project scaffold, requirements, custom `User` model, register/profile APIs, JWT auth, role-based access |
| 7–11 Aug | `medicine`, `prescriptions`, `cart` apps; cart & pharmacist APIs; order status; email; prescription verification; payment methods |
| 13–23 Aug | Frontend: dashboard, register/login, browse medicines, medicine detail, cart, checkout, Razorpay test integration, retry-payment fix |
| 24 Aug – 5 Sep | Order section, profile page, AI engine (Gemini OCR + fuzzy matcher), upload-prescription workflow, customer side completed, pharmacist role pages |
| 5–14 Sep | Pharmacist overview, inventory page + features, medicines page, notification feature, profile tab, active order panel, README |
| 15 Oct – 6 Oct | Localhost version declared final |

### Phase 2 — Deployment hardening (9–13 Oct 2026, 12 commits)

Render free-tier configuration plus the five blockers that stopped it going live
(Section 4).

### Phase 3 — Production bug fixes & UX (22 Oct – 2 Nov 2026, 10 commits)

Medicine-image data repair, pagination, cart/order images, `escapeHtml`, and five
inventory-filter fixes (Section 5).

---

## 3. Architecture Notes

- **Monolithic root layout.** Apps, `templates/`, `static/`, `config/` all sit at the
  repo root. Restructuring was offered and explicitly declined — this is intentional.
- **`common/`** holds cross-cutting infrastructure: `cloudinary_storage.py`,
  `exceptions.py` (custom DRF exception handler), `pagination.py`.
- **`ai_engine/`** — `gemini.py` (Gemini cloud OCR), `matcher.py` (RapidFuzz),
  `services.py` / `views.py`. Never local ML.
- **Role split** — customers use `/…` pages, pharmacists use `/pharmacist/…` pages;
  API permission is `IsPharmacistOrAdmin` on pharmacist endpoints, `IsAuthenticated`
  by default globally.
- **Inventory model** — one `Medicine` has many `Inventory` batches (batch number,
  expiry, stock, price, availability). Stock logic is therefore *per medicine* vs
  *per batch*, which is the source of most filter bugs in Section 5.

---

## 4. Deployment — Render Free Tier

All deployment work is committed in `render.yaml`, `requirements.txt` and
`config/settings.py`.

### Configuration decisions

| Decision | Why |
|---|---|
| `buildCommand`: `pip install … && collectstatic` | The **build container is not given `DATABASE_URL`**. Any DB command there crashes the build with `DB_NAME not found`. `collectstatic` never touches the database, and its output persists into the deployed image. |
| `startCommand`: `migrate` **then** `gunicorn` | `DATABASE_URL` only exists at runtime. This is the container's main process, so migrations run exactly once per boot — no race between workers. |
| `DATABASE_URL` via `fromDatabase: medibridge-db / connectionString` | Render does **not** inject it just because a database exists in the same blueprint. Omitting this left no DB config at all → `ImproperlyConfigured: Please supply the NAME`. |
| `ALLOWED_HOSTS=.onrender.com` | Covers the service and any future suffix. |
| `CSRF_TRUSTED_ORIGINS=https://*.onrender.com` | Render appends a random suffix to each new subdomain; a hardcoded URL silently goes stale. Wildcard is supported by Django; the CSRF token check still applies. |
| Secrets marked `sync: false` | `SECRET_KEY` is generated by Render; Brevo/Cloudinary/Razorpay/Gemini/SMTP credentials are pasted into the service **Environment** tab. Nothing secret lives in git. |
| Cloudinary media storage | Render free has **no persistent disk** — `media/` is wiped on every deploy. |
| `requirements.txt` trimmed 95 → **13** packages | It previously listed torch, transformers and three conflicting OpenCV builds that no code imported. The AI feature calls the Gemini *cloud* API. |

### Cloudinary storage

`common/cloudinary_storage.py` implements the Django Storage API against the
**official Cloudinary SDK**. `django-cloudinary-storage` was rejected: unreleased
since 2020 and built on `DEFAULT_FILE_STORAGE`, which Django 5.1 removed.

### Blockers found and fixed during deployment

| # | Commit | Blocker | Fix |
|---|---|---|---|
| 1 | `8632559` | Build failed — build container has no `DATABASE_URL` | Moved `migrate` out of `buildCommand` into `startCommand` |
| 2 | `d5cc7b5` | Service booted with no database configuration | Declared `DATABASE_URL` explicitly with `fromDatabase` |
| 3 | `b3054e7`, `29f7f6b` | `ALLOWED_HOSTS` / `CSRF_TRUSTED_ORIGINS` stale or missing | Hardcoded, then made suffix-proof with a wildcard |
| 4 | `6a6b7e1` | `/` rendered a **second** login page | `301` redirect `/` → `/login/` |
| 5 | `836f7bd` | `AttributeError` — `cloudinary.api` never imported | Added the import |
| 6 | `b6369e1` | **Prescription OCR crashed** — code read `file.path`, which does not exist on Cloudinary-backed storage | Read the file through the storage API (`open`/`read`) |
| 7 | `e67c85d` | PDFs accepted, but OCR cannot read them → silent failure | Reject PDFs with a clear message; JPG/PNG only |
| 8 | `9168c42` | **Checkout hung forever** on a blocked SMTP connection | Added explicit timeouts |
| 9 | `d9fd90a` | Render free **blocks outbound SMTP** (25/465/587) → no order email in production | Order email now goes over **Brevo's HTTPS API** (`POST /v3/smtp/email`, stdlib `urllib`, no new dependency); SMTP remains a fallback only when `BREVO_API_KEY` is empty |

### Free-tier constraints to remember

- Web service **sleeps after ~15 min** of inactivity; first request after a cold
  start takes ~20–30 s.
- **Free Postgres expires 90 days after creation → 9 November 2026.**
- No persistent disk (why media lives on Cloudinary).
- Razorpay keys are `rzp_test_` — test mode only.

---

## 5. Bugs Fixed

### 5.1 Data integrity — lost medicine images (22 Oct)

`media/` is not persisted on Render free, so uploaded medicine photos were destroyed
on redeploy: **16 of 19 images were gone**, and the UI faked the missing three with
placeholder pills.

- `c714535` — show the one surviving image; stop faking the other three.
- `5ca2afb` — repair via a **data migration** (`medicine/migrations/0003`) using an
  explicit `LOST` / `RECOVERED` filename list rather than a blind `UPDATE`.

> **Rule agreed:** this migration must run **before** any images are re-uploaded.
> Migration `0003` is already applied on Render — editing it will **not** re-run it.

### 5.2 Application bugs (28 Oct – 2 Nov)

| # | Commit | Symptom reported | Root cause | Fix |
|---|---|---|---|---|
| 10 | `76371b5` | Medicines list truncated — Volini missing, disabled medicines vanished, filters broke | `DefaultPagination.page_size = 10` while `pharmacist_medicines.js` **never followed `next`** → only the first 10 (alphabetical) rows ever rendered | `pagination_class = None` on `PharmacistMedicineListAPIView` |
| 11 | `3fd5d6f` | Cart and order pages showed a CSS pill instead of the real medicine photo | Serializers did not expose `image` | Added `image = serializers.ImageField(source="medicine.image", read_only=True)` to `cart/serializers.py` and `orders/serializers.py`; render `<img>` when present, placeholder **only** when `image` is `null` |
| 12 | `05e345e` | Order detail items vanished | Called `escapeHtml` — the file defines **`escapeHTML`** (capital H) → `ReferenceError` | Corrected both call sites |
| 13 | `d57864f` | *Low stock* disagreed with the stat cards (Amoxil 3+30=33 counted as low) | Filters classified **per batch** while the cards summed **per medicine** | In/Low/Out now match the **combined medicine total**; Active/Unavailable/All stay per-batch because they describe batch state |
| 14 | `c05790e` | *In stock* showed finished (stock 0) batches | Classification was per medicine but **every** row of that medicine rendered | Require `stock > 0` for In and Low. *Out of stock* keeps spent batches — a spent batch on a healthy medicine now appears under **no** stock filter, only *All inventory* |
| 15 | `4938481` | *Active* showed both Amoxil batches | Active matched every sellable batch | New `getCurrentSellingBatchIds()` — the **FEFO** batch per medicine (soonest-expiring, in stock, enabled, not expired), i.e. the batch customers actually receive and whose price applies |
| 16 | `680dcdd` | Products not in alphabetical order | **There was no name sort at all**: the API returned batches in global `expiry_date` order and appended no-batch medicines after, with PostgreSQL sorting `brand_name` case-sensitively (lowercase names last) | `compareInventoryRows()` applied once in `loadInventory()` — case-insensitive by name, then earliest expiry within a medicine (FEFO preserved). Every filter, search and statistic reads the same array |
| 17 | `da76b1d` | "Upload only the medicine portion" box unwanted | — | Removed the `.crop-notice` markup and its CSS (86 lines deleted) |

### 5.3 Known bug still open — restock does not restore availability

**Not fixed — awaiting a decision.**

1. `orders/services.py:255-257` sets `is_available = False` when a batch hits zero.
2. The restock form opens with the checkbox **unchecked**
   (`pharmacist_inventory.js:1437`), so PATCH sends `{stock: 20, is_available: false}`.
3. `available_stock` excludes unavailable rows → **Medicines page shows 0, Inventory
   shows 20** for the same batch.

This is exactly what happened with Calpol. (Re-adding the medicine in admin worked
because `models.py:50` defaults `is_available` to `True`.)

**Options offered:**

- **(A)** Frontend auto-ticks the checkbox and shows a note — *recommended*
- **(B)** Backend forces `is_available = True` whenever stock is restored
- **(C)** New schema field distinguishing auto-disable from manual disable
- **(D)** Leave as-is

---

## 6. Test Cases and Verification

### 6.1 Important caveat

**The project has no automated test suite.** All eight `tests.py` files are untouched
Django stubs (63 bytes each). Every fix was verified by the method below instead.

### 6.2 Method — behavioural testing of shipped code

1. `node --check` for syntax (necessary but **not sufficient** — it *passed* the
   `escapeHtml` `ReferenceError`, which only shows at runtime).
2. Extract the **real functions** from the committed JS (column-0 `}` boundary) and
   execute them under Node with a mocked DOM (`document`, table body, stat cards).
3. Assert on the **rendered row HTML**, not on intermediate values — i.e. test what
   the user actually sees.
4. Re-verify the deployed artefacts by fetching the live static files.

> **Lesson:** an earlier extraction attempt over-ran into top-level event wiring.
> Extraction must stop at the first column-0 `}`.

### 6.3 Test suites

| Date | Suite | Scope | Assertions | Result |
|---|---|---|---|---|
| 2 Nov | Cart / order images | `cart.js`, `orders.js`, `order_detail.js` — image present → `<img>`, `null` → CSS pill placeholder | 17 | **PASS** |
| 2 Nov | Stock filters vs cards | In/Low/Out on combined totals; cards must equal distinct-medicine counts | 18 | **PASS** |
| 2 Nov | Finished batches | Medicine with batches `[0, 50]` | 25 (24 meaningful — 1 was a placeholder assertion) | **PASS** |
| 2 Nov | Active = FEFO batch | Two sellable batches, expired-but-flagged batch, disabled, finished | — | **PASS** |
| 2 Nov | Alphabetical ordering | 12 rows fed in real API order | 22 | **PASS** |
| 3 Nov | Live deployment smoke | Probes against the deployed site | 6 | **PASS** |

### 6.4 Key evidence — finished batches (`c05790e`)

Dataset: Crocin with `K1 = 0` (finished) and `K2 = 50`.

```
pass  Crocin healthy batch K2 (50) shown under In stock
pass  Crocin FINISHED batch K1 (0) hidden from In stock   <-- THE FIX
pass  Crocin K1 NOT under Out of stock (Crocin total is 50)
pass  In stock shows 4 rows (Amoxil x2, Dolo, Crocin K2)
pass  All inventory shows all 7 batch rows        <- nothing is lost
```

### 6.5 Key evidence — Active = current selling batch (`4938481`)

```
pass  Amoxil -> batch 101 (earliest expiry 2027-12-31)
pass  Amoxil batch 102 (2028-07-23) NOT the current selling batch
pass  expired Shelcal batch 601 NOT chosen despite earlier expiry
pass  Active shows Amoxil current batch AMOX500TEST01
pass  Active hides Amoxil other batch MB-2027-006   <-- THE FIX
pass  Active shows 4 rows (Amoxil A1, Betadine, Crocin K2, Shelcal S2)
pass  In stock still shows BOTH Amoxil batches
```

### 6.6 Key evidence — alphabetical ordering (`680dcdd`)

```
BEFORE: Crocin, Shelcal, Calpol, Amoxil, Shelcal, Crocin, Betadine, Amoxil, Dolo,
        Paracetamol Syrup, Zincovit, aspirin
AFTER:  Amoxil, Amoxil, aspirin, Betadine, Calpol, Crocin, Crocin, Dolo,
        Paracetamol Syrup, Shelcal, Shelcal, Zincovit

pass  All inventory renders fully alphabetical, 12 rows in order
pass  lowercase "aspirin" sorts before "Betadine" (case-insensitive)  <-- was LAST
pass  appended no-batch medicine sits between Dolo and Shelcal, NOT at the end
pass  Amoxil current batch still first of the two   (FEFO preserved)
pass  Active = 4 rows, In stock = 6 rows, Low = 1, Out = 4  (unchanged)
pass  cards: total 9, in 4, low 1, out 4   (agree with filters)
pass  search "crocin" -> 2 Crocin rows
```

---

## 7. Live Verification (3 November 2026)

| Probe | Result |
|---|---|
| `GET /` | `301 → /login/` |
| `GET /login/` | `200`, login form present |
| `GET /api/v1/medicine/` | `200`, **17 medicines, 0 missing images** (all Cloudinary URLs) |
| `GET /static/css/upload_prescription.css` | `200`, **no `crop-notice`** → removal deployed |
| `GET /upload-prescription/` | `200`, notice absent |
| Served `cart.js` | contains `item.image` + `escapeHTML(` |
| Served `orders.js` | contains `item.image` |
| Served `order_detail.js` | defines `function escapeHTML` |
| Served `pharmacist_inventory.js` | contains `compareInventoryRows` and `getCurrentSellingBatchIds` |
| Brevo delivery reports | **10 delivered, 0 errors** — 28 Oct: 3/3/0 · 2 Nov: 7/7/0 |

**Medicine images — all 17 live:**

Allegra 120, Amoxil, Band-Aid, Becosules, Becozinc G, Benadryl, Betadine,
Calpol 500, Crocin 500, Dettol Antiseptic Liquid, Digene, Dolo 650, Electral,
Elkocet, Melacyl, Shelcal 500, volini — every one backed by
`res.cloudinary.com/ce0fczac/…`.

---

## 8. Open Items

| Priority | Item | Detail |
|---|---|---|
| **Critical** | **Export data before 9 November 2026** | Free Postgres expires **9 November 2026** — 6 days from this report. Export `medibridge-db` from the Render dashboard. |
| **High** | Rotate leaked secrets | A **Gmail app password** and the **Cloudinary API secret** were pasted into chat. Rotate both (`config/.env` and the Render Environment tab). |
| **High** | Delete Render test artifacts | `mb_smoketest_ce9b53`, prescription `7be10a3c-805d-4572-8fec-7b1ac212d2dd`, Cloudinary `prescriptions/smoketest_upload.jpeg`. |
| **Medium** | Restock bug | Section 5.3 — needs a decision (A–D). |
| **Medium** | No automated test suite | All verification is ad-hoc; consider porting the Node suites into committed tests. |
| Low | Razorpay in test mode | Swap `rzp_test_` keys before taking real money. |
| Low | Email may land in Promotions/Spam | Single-sender Gmail verification accepted; domain authentication was rejected because it costs money. |
| Low | Cold starts ~20–30 s | Inherent to Render free after ~15 min idle. |

---

## 9. Agreed Constraints

These were explicitly settled during the project and should be respected in future work:

1. **Render free tier only** — no paid plan of any kind; no custom domain purchased.
2. **Fix real bugs and real deploy blockers only** — no style churn, no speculative
   improvements.
3. **Ask before data-destructive or contract-breaking changes.**
4. **Monolithic root layout stays** — repo restructuring declined.
5. **FEFO allocation is correct and stays** (`.order_by("expiry_date")`,
   `expiry_date__gte=today`, `@transaction.atomic` + `select_for_update` on
   `process_order`).
6. **Cart/order pages show real medicine images**, falling back to the CSS pill only
   when `image` is `null`.
7. **Image repair is a data migration**, not a one-off `UPDATE`, and must run before
   images are re-uploaded.
8. Branch **`deployment-backup`** is ignored.

---

## 10. Key Files

| Path | Purpose |
|---|---|
| `render.yaml` | Render Blueprint — build/start commands, env vars, database |
| `requirements.txt` | 13 pinned runtime packages (trimmed from ~95) |
| `config/settings.py` | Django + DRF + JWT + WhiteNoise + Cloudinary config |
| `common/cloudinary_storage.py` | Custom Cloudinary Storage backend (official SDK) |
| `common/pagination.py` | `DefaultPagination.page_size = 10` |
| `common/exceptions.py` | Custom DRF exception handler |
| `orders/services.py` | `process_order` — atomic FEFO allocation, auto-disable at zero |
| `medicine/serializers.py` | `get_available_stock`, pharmacist inventory/medicine serializers |
| `medicine/views.py` | Pharmacist list views (`pagination_class = None` at line 317) |
| `medicine/migrations/0003` | Image repair data migration (`LOST` / `RECOVERED`) |
| `ai_engine/gemini.py`, `ai_engine/matcher.py` | Prescription OCR + fuzzy medicine matching |
| `static/js/pharmacist_inventory.js` | Stock filters, FEFO active batch, alphabetical sort |
| `config/.env` | Local-only secrets (gitignored) — sole local copy of the Brevo key |
| `PROJECT_REPORT.md` | This report |

# ResQ Ko, Mahal Ko

A modular community healthcare assistance and disaster-response web application for Philippine communities. This project extends the supplied React/Express/MySQL starter rather than replacing its authentication foundation.

## Technology
- Frontend: React 18, Vite, JavaScript, HTML, CSS
- Backend: Node.js, Express, Nodemon
- Database: MySQL + `mysql2`
- Authentication: JWT + bcryptjs
- Maps: OpenStreetMap + Leaflet; route geometry through the public OSRM demo routing service
- Weather: Open-Meteo current conditions/forecast plus UP NOAH latest rainfall contour and PAGASA typhoon-track GeoJSON feeds
- AI: Google Gemini API (server-side only)

No PHP, Laravel, or Python is used.

## Requirements
- Node.js 18 or newer (Node 20 LTS recommended)
- MySQL 8.x
- MySQL Workbench (optional, for importing the schema)

## Setup

### 1. Import the database
1. Open MySQL Workbench and connect to your local MySQL server.
2. Open `database/resq_ko_mahal_ko.sql`.
3. Execute the entire script. It creates `resq_ko_mahal_ko` and its tables.
4. Sample directory/warning/relief rows are explicitly labeled demonstration data. Replace them with verified LGU records before real use.

### 2. Configure and start the backend
```bash
cd backend
npm install
```
Copy `backend/.env.example` to `backend/.env` and set your MySQL credentials, a long random `JWT_SECRET` (at least 32 characters), and a valid Google AI Studio `GEMINI_API_KEY` to enable ResQ AI. Keep `.env` private; never commit or share the key. If a key was previously copied into a tracked file, revoke it and use a newly rotated key.

After the database has been imported and `.env` is configured, apply the additive admin-workflow tables:
```bash
npm run migrate:admin-workflows
```

```bash
npm run dev
```
The API runs at `http://localhost:5001`. Check `http://localhost:5001/api/health`.

### 3. Create the first administrator
In another terminal:
```bash
cd backend
npm run create-admin
```
Enter the admin name, email, and password. Public registration always creates `user` role accounts; the admin role is only assigned by this local script.

### 4. Optionally seed local demo accounts
After importing the database and applying the admin-workflow migration, you can create 50 fictional accounts with distinct demo display names and sample incident, assistance, relief, and support records. The script only targets the local `resq_ko_mahal_ko` database, refuses production mode, requires an explicit opt-in, and will not overwrite existing demo accounts. All seeded users share the test password you provide:
```powershell
cd backend
$env:SEED_DEMO_DATA = "1"
$env:DEMO_USER_PASSWORD = "choose-a-local-test-password"
npm run seed:demo
Remove-Item Env:SEED_DEMO_DATA, Env:DEMO_USER_PASSWORD
```
Use a test-only password and do not reuse a real account password. Do not run this against production data.

### 5. Configure and start the frontend
```bash
cd frontend
npm install
```
Copy `frontend/.env.example` to `frontend/.env` if you need a non-default API URL. Then:
```bash
npm run dev
```
Open `http://localhost:5173`.

## Main pages
- `/` public landing page
- `/register` user registration
- `/login` user login
- `/admin/login` administrator login
- `/dashboard` user workspace
- `/admin` administrator workspace

## Implemented backend-connected modules
- Registration, user/admin login, JWT-protected profile lookup, profile update endpoint, and role middleware
- Healthcare directory read; admin create/update/delete
- Disaster warning read; admin create/update/delete
- Evacuation center read; admin create/update/delete
- Relief record read; admin create/update/delete
- Incident report submission with up to five JPG/PNG files, user-scoped report listing, evidence listing, and admin moderation/rejection reason
- Emergency assistance submission, user-scoped tracking, and admin status management
- Admin account list, dashboard metrics, report-status pie charts, and seven-day activity graph
- Admin support inbox for user complaints, technical issues, and password/access help
- User-scoped support request history and staff replies; passwords are never requested or stored
- Urgency triage for assistance and incident queues, without inventing incident severity
- Contact-only admin profile review with access logging; health details remain hidden
- User-submitted relief needs with admin verification, distribution tracking, and coordination notes
- Sourced, time-limited in-app announcements for all users or a selected barangay
- Admin activity log for profile access, moderation, relief status changes, and announcements
- ResQ AI server endpoint with topic scope and rate limiting
- Philippines-only Open-Meteo forecasts by current location or searched city, including hourly rain probability
- UP NOAH/PAGASA typhoon tracks and USGS recent earthquake activity filtered to Philippine coordinates
- Opt-in browser notifications for new feed items while the app is open
- Optional profile photo, travel location, emergency contact, blood type, health conditions, and allergy details
- Local English, Filipino, and Cebuano interface translations; language selection updates the interface without a third-party translation service
- Leaflet/OpenStreetMap map display and OSRM route geometry (red)

## Data and integration limitations — read before deployment
- **PAGASA and PHIVOLCS:** This project links to official information sources and allows administrators to enter source-attributed warnings. Verify data and source URLs before publishing warnings.
- **UP NOAH:** The weather page reads the public rainfall-contour image and PAGASA typhoon-track GeoJSON currently used by the UP NOAH weather map. A feed with no plotted tracks does not predict whether a typhoon may form later; use PAGASA bulletins for official advisories. Public endpoints may change or be unavailable.
- **Weather and alerts:** Open-Meteo provides local forecast conditions and rain probabilities; UP NOAH supplies the PAGASA typhoon-track feed. Recent earthquakes come from the USGS catalog with a geographic Philippines filter, not an earthquake prediction or official PHIVOLCS warning. Verify all hazards with PAGASA, PHIVOLCS, and local authorities. Browser alerts require permission and only update while ResQ is open; this prototype does not implement background web push.
- **Location scope:** Weather lookup and place search are intentionally limited to the Philippines. The typed city is resolved through OpenStreetMap Nominatim; coordinates are sent to the weather service to retrieve the forecast. Only share a location when comfortable.
- **Profile and health information:** Profile health details are optional and are returned only by the authenticated profile endpoint, not the administrator user directory. Treat this prototype's account storage as sensitive personal data and deploy only with suitable privacy, access-control, and retention protections.
- **Language support:** The English, Filipino, and Cebuano interface strings are bundled locally. Official feed content and user-submitted text may remain in their original language; no profile or health information is sent to a translation provider.
- **Existing database:** Re-run `database/resq_ko_mahal_ko.sql` to apply its safe, additive profile-column upgrade to an existing MySQL database.
- **Maps and routes:** OpenStreetMap tiles and the OSRM public demo service require internet access. OSRM alternatives may be returned by the service; this prototype currently draws the returned route geometries in red. Public demo services are not guaranteed production SLAs.
- **Facilities/evacuation centers:** Sample entries are marked as sample and must be replaced with verified local data, accurate coordinates, contact numbers, capacity, and availability.
- **AI:** Configure `GEMINI_API_KEY` in backend `.env` for Google Gemini. Keep credentials server-side; never put them in frontend `.env`. The chatbot is informational, not a medical professional; it must not diagnose or prescribe. Call 911 for life-threatening emergencies in the Philippines.
- **Photo storage:** Uploads are stored locally in `backend/uploads`. For deployment, use private object storage, authenticated image delivery, malware scanning, backups, and retention controls.
- **Security:** Before public deployment add HTTPS, stronger account/session lifecycle controls, audit monitoring, CSRF strategy if using cookies, file malware scanning, backup/restore, privacy notice and consent, and a security review. The current JWT is stored in browser localStorage and is suitable only for a controlled prototype/demo, not a hardened production deployment. Optional health and travel-location profile fields are kept out of localStorage.
- **Legal declaration:** The report form displays the requested declaration; obtain legal review of its wording before public use.

## Useful API routes
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/admin/login`, `GET/PATCH /api/auth/me`
- `GET /api/healthcare`; admin `POST/PUT/DELETE /api/healthcare`
- `GET /api/warnings`; admin `POST/PUT/DELETE /api/warnings`
- `GET /api/evacuation`; admin `POST/PUT/DELETE /api/evacuation`
- `GET /api/relief`; admin `POST/PUT/DELETE /api/relief`
- Authenticated `GET/POST /api/incidents`, `GET /api/incidents/:id/photos`, admin `PATCH /api/incidents/:id/moderate`
- Authenticated `GET/POST /api/assistance`, admin `PATCH /api/assistance/:id/status`
- Admin `GET /api/admin/overview`, `GET /api/admin/charts`, `GET /api/admin/users`
- Authenticated `GET/POST /api/support`, admin `PATCH /api/support/:id`
- `POST /api/ai-chat`, `GET /api/weather?lat=...&lon=...`

## Troubleshooting
- `database not connected`: confirm MySQL is running and `.env` credentials/database name are correct.
- `JWT_SECRET must be set`: set a random secret with 32+ characters in `backend/.env`.
- CORS error: set `FRONTEND_URL=http://localhost:5173` in backend `.env`.
- Upload errors: ensure `backend/uploads` is writable and each image is JPG/PNG under the configured size limit.
- AI unavailable: set a valid, active Google AI Studio key as `GEMINI_API_KEY` in backend `.env`, restart the backend, and confirm Gemini API access. The example file intentionally contains no key.

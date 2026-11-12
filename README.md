# ResQ Ko, Mahal Ko

A modular community healthcare assistance and disaster-response web application for Philippine communities. This project extends the supplied React/Express/MySQL starter rather than replacing its authentication foundation.

## Technology
- Frontend: React 18, Vite, JavaScript, HTML, CSS
- Backend: Node.js, Express, Nodemon
- Database: MySQL + `mysql2`
- Authentication: JWT + bcryptjs
- Maps: OpenStreetMap + Leaflet; route geometry through the public OSRM demo routing service
- Weather: Open-Meteo forecast endpoint
- AI: OpenAI Chat Completions API (server-side only)

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
Copy `backend/.env.example` to `backend/.env` and set your MySQL credentials plus a long random `JWT_SECRET` (at least 32 characters). Set `OPENAI_API_KEY` only if you want to enable ResQ AI. Keep `.env` private.

```bash
npm run dev
```
The API runs at `http://localhost:5000`. Check `http://localhost:5000/api/health`.

### 3. Create the first administrator
In another terminal:
```bash
cd backend
npm run create-admin
```
Enter the admin name, email, and password. Public registration always creates `user` role accounts; the admin role is only assigned by this local script.

### 4. Configure and start the frontend
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
- Admin account list and dashboard statistics
- ResQ AI server endpoint with topic scope and rate limiting
- Open-Meteo weather lookup by coordinates
- Leaflet/OpenStreetMap map display and OSRM route geometry (red)

## Data and integration limitations — read before deployment
- **PAGASA, PHIVOLCS, and UP NOAH:** This project links to official information sources and allows administrators to enter source-attributed warnings. It does not claim a live official API integration or invent endpoints. Verify data and source URLs before publishing warnings.
- **Weather:** The current weather endpoint uses Open-Meteo. It is not an official PAGASA warning feed.
- **Maps and routes:** OpenStreetMap tiles and the OSRM public demo service require internet access. OSRM alternatives may be returned by the service; this prototype currently draws the returned route geometries in red. Public demo services are not guaranteed production SLAs.
- **Facilities/evacuation centers:** Sample entries are marked as sample and must be replaced with verified local data, accurate coordinates, contact numbers, capacity, and availability.
- **AI:** Set `OPENAI_API_KEY` in backend `.env`. Never put it in frontend `.env`. The chatbot is informational, not a medical professional; it must not diagnose or prescribe. Call 911 for life-threatening emergencies in the Philippines.
- **Photo storage:** Uploads are stored locally in `backend/uploads`. For deployment, use private object storage, authenticated image delivery, malware scanning, backups, and retention controls.
- **Security:** Before public deployment add HTTPS, stronger account/session lifecycle controls, audit monitoring, CSRF strategy if using cookies, file malware scanning, backup/restore, privacy notice and consent, and a security review. The current JWT is stored in browser localStorage and is suitable only for a controlled prototype/demo, not a hardened production deployment.
- **Legal declaration:** The report form displays the requested declaration; obtain legal review of its wording before public use.

## Useful API routes
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/admin/login`, `GET/PATCH /api/auth/me`
- `GET /api/healthcare`; admin `POST/PUT/DELETE /api/healthcare`
- `GET /api/warnings`; admin `POST/PUT/DELETE /api/warnings`
- `GET /api/evacuation`; admin `POST/PUT/DELETE /api/evacuation`
- `GET /api/relief`; admin `POST/PUT/DELETE /api/relief`
- Authenticated `GET/POST /api/incidents`, `GET /api/incidents/:id/photos`, admin `PATCH /api/incidents/:id/moderate`
- Authenticated `GET/POST /api/assistance`, admin `PATCH /api/assistance/:id/status`
- Admin `GET /api/admin/overview`, `GET /api/admin/users`
- `POST /api/ai-chat`, `GET /api/weather?lat=...&lon=...`

## Troubleshooting
- `database not connected`: confirm MySQL is running and `.env` credentials/database name are correct.
- `JWT_SECRET must be set`: set a random secret with 32+ characters in `backend/.env`.
- CORS error: set `FRONTEND_URL=http://localhost:5173` in backend `.env`.
- Upload errors: ensure `backend/uploads` is writable and each image is JPG/PNG under the configured size limit.
- AI unavailable: add a valid OpenAI API key to backend `.env`, restart Nodemon, and confirm account API access.

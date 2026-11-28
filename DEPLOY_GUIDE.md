# 🚀 Deployment Guide — ResQ Ko, Mahal Ko

## Overview
- **Frontend** → Vercel (already deployed ✅)
- **Backend** → Vercel (new, separate project)
- **Database** → Railway (free cloud MySQL)

---

## STEP 1: Set up Free Cloud MySQL on Railway

1. Go to **https://railway.app** → Sign up / Log in (free)
2. Click **New Project → Deploy MySQL**
3. After it deploys, click the MySQL service → **Variables** tab
4. Copy these values (you'll need them in Step 2):
   - `MYSQLHOST` → your DB_HOST
   - `MYSQLPORT` → your DB_PORT
   - `MYSQLUSER` → your DB_USER
   - `MYSQLPASSWORD` → your DB_PASSWORD
   - `MYSQLDATABASE` → your DB_NAME (use `resq_ko_mahal_ko`)

5. **Import your database schema:**
   - In Railway MySQL service → click **Connect** → open **MySQL GUI** or use TablePlus/DBeaver
   - Connect with the credentials above
   - Run the file: `database/resq_ko_mahal_ko.sql`

---

## STEP 2: Deploy Backend to Vercel

1. Go to **https://vercel.com/new**
2. Import your GitHub repo
3. **IMPORTANT:** Set **Root Directory** to `backend`
4. Framework Preset: **Other**
5. Click **Deploy**

After deploy, you'll get a URL like: `https://resq-ko-mahal-ko-backend.vercel.app`

---

## STEP 3: Set Environment Variables on Backend Vercel Project

Go to your **backend** Vercel project → Settings → Environment Variables → add these:

| Key | Value |
|-----|-------|
| `DB_HOST` | (from Railway MYSQLHOST) |
| `DB_PORT` | (from Railway MYSQLPORT) |
| `DB_USER` | (from Railway MYSQLUSER) |
| `DB_PASSWORD` | (from Railway MYSQLPASSWORD) |
| `DB_NAME` | `resq_ko_mahal_ko` |
| `DB_SSL` | `true` |
| `DB_CONNECTION_LIMIT` | `2` |
| `JWT_SECRET` | (any random 32+ character string) |
| `GEMINI_API_KEY` | (your Gemini API key) |
| `GEMINI_MODEL` | `gemini-1.5-flash` |
| `FRONTEND_URL` | `https://YOUR-FRONTEND.vercel.app` |

After adding all vars → **Redeploy** the backend.

---

## STEP 4: Update Frontend with Backend URL

1. Open: `frontend/.env.production`
2. Replace `REPLACE_WITH_YOUR_BACKEND_URL` with your actual backend Vercel URL
   Example: `VITE_API_URL=https://resq-ko-mahal-ko-backend.vercel.app/api`
3. Commit and push → Vercel will auto-redeploy the frontend

---

## STEP 5: Set Environment Variable on Frontend Vercel Project

Go to your **frontend** Vercel project → Settings → Environment Variables → add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-backend.vercel.app/api` |

Then **Redeploy** the frontend.

---

## Verify It's Working

Visit: `https://your-backend.vercel.app/api/health`

You should see:
```json
{ "status": "ok", "database": "connected" }
```

---

## Tips

- Railway free tier gives you $5/month credit — more than enough for this project
- Vercel free tier (Hobby) allows unlimited serverless functions
- Your `database/resq_ko_mahal_ko.sql` file has all the schema ready to import

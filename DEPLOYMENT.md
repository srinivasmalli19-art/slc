# Frontend & Backend Deployment Guide

## Architecture
- **Backend**: FastAPI on Render.com (Python)
- **Frontend**: React on Vercel/Netlify (Node.js) — Recommended
  - Alternative: Deploy frontend to separate Render Web Service

## Backend Deployment (Render.com)

### Option 1: Using render.yaml (Recommended)
The `render.yaml` file contains backend deployment config. Render auto-detects it.

### Option 2: Manual Configuration
In Render dashboard:

**Build Command:**
```bash
pip install --upgrade pip && pip install -r requirements.txt
```

**Start Command (FastAPI + Uvicorn):**
```bash
uvicorn server:app --host 0.0.0.0 --port 10000 --workers 2
```

### Backend Environment Variables
Set in Render dashboard → Settings → Environment:
- `MONGO_URL` - MongoDB Atlas connection string
- `DB_NAME` - Database name (e.g., `slc_db`)
- `JWT_SECRET` - Random secret key (change in production!)
- `CORS_ORIGINS` - Frontend URLs: `https://slcvet.com,https://www.slcvet.com`
- `ENVIRONMENT` - Set to `production`

### Backend Service URL
Render assigns: `https://slc-backend.onrender.com` or custom domain

---

## Frontend Deployment (Vercel - Easiest)

### Quick Setup (Vercel)
```bash
npm i -g vercel
cd frontend
vercel --prod
```

### Environment Variables for Frontend
Create `frontend/.env.production`:
```env
REACT_APP_BACKEND_URL=https://slc-backend.onrender.com
```

Or set in Vercel dashboard → Settings → Environment Variables

### Frontend URL
Vercel assigns: `https://slcvet.vercel.app` or connect custom domain `https://slcvet.com`

---

## Alternative: Deploy Frontend to Render

If deploying both to Render, create a **separate Web Service** for frontend:

**Build Command:**
```bash
npm install --legacy-peer-deps && npm run build
```

**Start Command:**
```bash
npm start
```

---

## Update Frontend API URL
After backend is deployed, update `frontend/.env.production`:
```env
REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com
```

Then rebuild and redeploy frontend.

---

## Troubleshooting

### Backend: `ModuleNotFoundError: No module named 'pkg_resources'`
- ✅ Fixed: Added `setuptools` to requirements.txt

### Backend: `TypeError: FastAPI.__call__() missing 1 required positional argument`
- ✅ Fixed: Use `uvicorn` (ASGI server), not plain gunicorn (WSGI)

### Frontend: `npm error code ERESOLVE`
- ✅ Fixed: Downgraded `react@18.3.1` (compatible with `react-day-picker@8.10.1`)

### CORS Errors on Frontend
- Ensure `CORS_ORIGINS` in backend includes your frontend domain
- Restart backend after changing env vars

---

## DNS / Domain Setup (GoDaddy)

For `https://slcvet.com`:

1. **Frontend** (Vercel): Point domain to Vercel nameservers
   - GoDaddy → Domains → DNS → Update nameservers
   - Use Vercel's nameservers

2. **Backend** (Render): Use CNAME
   - Create CNAME: `api.slcvet.com` → `slc-backend.onrender.com`
   - In Render: Add custom domain `api.slcvet.com`

---

## Deployment Checklist

- [ ] Backend deployed on Render with env vars set
- [ ] Frontend deployed on Vercel/Netlify
- [ ] `REACT_APP_BACKEND_URL` points to correct backend URL
- [ ] `CORS_ORIGINS` includes frontend domain
- [ ] DNS/domains configured
- [ ] Test login from frontend → backend works
- [ ] HTTPS enabled on both (default on Render/Vercel)

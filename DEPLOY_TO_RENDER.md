# Deployment Guide: Frontend to Render

## Changes Made

The frontend now includes:
1. **Runtime backend URL input** on the login page — no rebuild needed to switch backends
2. **Backend autodetect** — probes known backend hosts if env var is not set
3. **Stored backend URL** — localStorage persists the chosen backend between sessions
4. **Defensive error handling** — clear error messages if backend is unreachable

## Modified Files
- `frontend/src/lib/api.js` — Added `setApiBase()`, `getStoredBackend()`, `clearStoredBackend()`
- `frontend/src/context/AuthContext.js` — Backend autodetect and stored URL lookup
- `frontend/src/components/pages/LoginPage.jsx` — Backend input UI + apply button
- `frontend/package.json` — React downgraded to ^18.3.1 (already done, no change needed)

## Quick Deploy Steps (Option A: Git Auto-Deploy)

1. In terminal at the repo root:
```bash
cd c:\Users\brahm\OneDrive\Desktop\repository\slc

# Verify build exists
if exist "frontend\build\index.html" (
  echo Build ready
) else (
  echo Need to rebuild
  cd frontend
  npm run build
  cd ..
)

# Commit changes
git add .
git commit -m "Frontend: add runtime backend URL selector and autodetect"

# Push to repo (auto-triggers Render deploy)
git push origin main
```

2. Open Render dashboard → frontend service → check "Deploys" to see deployment progress.

## Deploy Steps (Option B: Manual Render Deploy)

1. Build the production bundle:
```bash
cd frontend
npm run build
```

2. In Render dashboard:
   - Go to your frontend service
   - Click "Manual Deploy"
   - Select the latest commit
   - Click "Build"

## After Deployment

Once deployed, the frontend login page will show a **"Backend"** link in the top-right corner:
1. Click it to reveal an input field
2. Enter your backend URL (e.g., `https://your-backend-host`)
3. Click "Apply"
4. Try logging in

**For local testing:**
- Use `http://localhost:8000` as the backend URL
- Ensure your backend `CORS_ORIGINS` includes `https://slc-1.onrender.com`

## Backend CORS Setup

If you get CORS errors on deploy, update your backend:

**File: `backend/server.py`**
```python
# Update CORS middleware to include deployed frontend
allow_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://slc-1.onrender.com",  # your frontend host
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then redeploy the backend.

## Testing Login

1. Go to `https://slc-1.onrender.com` (or your frontend URL)
2. Click "Backend" and enter backend URL
3. Click "Apply"
4. Try logging in with any phone/password (offline mode will accept it)
5. You should see welcome message and redirect

## Environment Variable (Alternative to Runtime Input)

To avoid the runtime input, set in Render frontend environment:
1. Render dashboard → frontend service → Settings → Environment Variables
2. Add: `REACT_APP_BACKEND_URL = https://your-backend-host`
3. Save and redeploy

---

**Need help?** Check the console (F12 → Console tab) for messages like:
- `[auth] backend autodetect: using https://...` — backend found
- `[auth] backend autodetect did not find a reachable backend` — no backend found; use Backend input

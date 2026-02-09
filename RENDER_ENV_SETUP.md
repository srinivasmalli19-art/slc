# Render Environment Setup Guide

## Problem
The frontend `.env` file is git-ignored (security best practice), so we can't commit the backend URL directly. Instead, set it in Render's environment variables.

## Solution: Set REACT_APP_BACKEND_URL in Render

### For Your Frontend Service (`slc-1.onrender.com`)

1. Go to: https://dashboard.render.com
2. Select your **frontend service** (`slc-1` or similar name)
3. Click **Settings** tab
4. Scroll to **Environment Variables** section
5. Click **Add Environment Variable**
6. Enter:
   - **Key**: `REACT_APP_BACKEND_URL`
   - **Value**: `https://slc-qls9.onrender.com`
7. Click **Save**
8. Click **"Manual Deploy"** button (or wait for auto-deploy)
9. Wait for deployment to show **"Live"** status

### Expected Behavior After Deploy

When you visit `https://slc-1.onrender.com`:
- The frontend will use `REACT_APP_BACKEND_URL=https://slc-qls9.onrender.com` (no need for runtime Backend input)
- Login will call the correct backend
- If login fails, it shows a clear error message

---

## Also Check: Backend CORS Configuration

Your backend at `https://slc-qls9.onrender.com` needs to allow the frontend origin. 

**Check backend logs/settings** to ensure it has:
```python
allow_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://slc-1.onrender.com",  # ← Add this
    "*",  # or allow all (less secure)
]
```

If it doesn't, update `backend/server.py` and redeploy the backend.

---

## Testing

After the frontend redeploys:
1. Open: `https://slc-1.onrender.com/login`
2. Try logging in with:
   - Phone: `1234567890` (any number)
   - Password: `test` (any password)
   - Role: `Farmer`
3. Expected result:
   - If no CORS error: Welcome message appears ✓
   - If CORS error: See "Access to fetch" error in console → update backend CORS and redeploy

---

## Troubleshooting Console Messages

Open DevTools (F12 → Console) and look for:
- `[auth] backend autodetect: using https://slc-qls9.onrender.com` — Backend found ✓
- `Access to fetch at '[backend]' from origin '[frontend]' has been blocked by CORS` — Backend CORS not configured for this frontend

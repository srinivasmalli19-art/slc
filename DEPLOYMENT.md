# Render.com Deployment Guide

## Quick Setup

### Option 1: Using render.yaml (Recommended)
The `render.yaml` file in the root contains the full deployment configuration. Render will automatically use it when you connect your Git repo.

### Option 2: Manual Configuration
If not using `render.yaml`, configure in Render dashboard:

**Build Command:**
```
pip install --upgrade pip && pip install -r requirements.txt
```

**Start Command (FastAPI + Gunicorn):**
```
gunicorn server:app --worker-class uvicorn.workers.UvicornWorker --workers 2 --bind 0.0.0.0:10000
```

## Critical Notes

### For FastAPI, use uvicorn workers:
```bash
gunicorn server:app --worker-class uvicorn.workers.UvicornWorker
```

❌ **DO NOT use:**
```bash
gunicorn server:app  # This will fail - try to run as WSGI
```

### Environment Variables Required
- `MONGO_URL` - MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/`)
- `DB_NAME` - Database name (e.g., `slc_db`)
- `JWT_SECRET` - Any random string (change in production)
- `CORS_ORIGINS` - Frontend URLs (e.g., `https://slcvet.com,https://www.slcvet.com`)

### Update frontend API URL
In `frontend/.env`, update:
```env
REACT_APP_BACKEND_URL=https://your-render-backend-url.onrender.com
```

## Backend Service URL Format
Render assigns URLs like: `https://slc-backend.onrender.com`

## Troubleshooting

**Error: `ModuleNotFoundError: No module named 'pkg_resources'`**
- Solution: Added `setuptools` to requirements.txt ✅

**Error: `gunicorn: command not found`**
- Ensure `gunicorn` is in requirements.txt ✅
- Ensure build command runs `pip install -r requirements.txt`

**App crashes with ASGI error**
- Make sure using `--worker-class uvicorn.workers.UvicornWorker`
- Check `spawn` method in Python on some platforms

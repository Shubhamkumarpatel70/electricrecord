# Render Deployment Fix

## Issue
Render was trying to clone from the wrong repository URL and the build was failing.

## Solution

### Step 1: Update Repository URL in Render Dashboard

1. Go to your Render dashboard
2. Find your service
3. Go to **Settings** → **Repository**
4. Update the repository URL to: `https://github.com/Shubhamkumarpatel70/electricrecord.git`
5. Make sure the branch is set to `main`

### Step 2: Manual Service Configuration

If using manual setup (not Blueprint), configure:

**Build Command:**
```bash
npm install && cd client && npm install && cd .. && npm run build
```

**Start Command:**
```bash
npm start
```

**Environment Variables:**
- `NODE_ENV` = `production`
- `MONGODB_URI` = Your MongoDB connection string
- `JWT_SECRET` = A strong random string
- `ADMIN_EMAIL` = `admin@power.local`
- `ADMIN_PASSWORD` = `Admin@1234`

**Important:** Do NOT set a "Publish Directory" - this is for static sites only. Leave it empty.

### Step 3: Verify Service Type

Make sure the service type is **Web Service** (not Static Site).

### Step 4: Redeploy

After updating the repository URL and configuration:
1. Go to **Manual Deploy** → **Deploy latest commit**
2. Or push a new commit to trigger automatic deployment

## Alternative: Delete and Recreate

If issues persist:

1. Delete the current service
2. Create a new Web Service
3. Connect to: `https://github.com/Shubhamkumarpatel70/electricrecord.git`
4. Use the configuration above
5. Deploy

## Build Process

The build will:
1. Install server dependencies (`npm install`)
2. Install client dependencies (`cd client && npm install`)
3. Build React app (`npm run build`)
4. Start server (`npm start`)

The server will serve both API and React app from the same service.


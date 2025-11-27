# Development Guide

## Quick Start

### Option 1: Run Both Servers Together (Recommended)
```bash
npm run dev
```
This starts both the backend (port 5000) and frontend (port 3000) simultaneously.

**Access the app at: http://localhost:3000**

**Note:** If you see "Something is already running on port 5000" error:
1. Make sure `client/.env` file exists with `PORT=3000`
2. Stop any processes using port 3000 or 5000
3. Restart with `npm run dev`

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
npm run server
# or
npm start
```
Backend runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
npm run client
# or
cd client && npm start
```
Frontend runs on: http://localhost:3000

**Access the app at: http://localhost:3000**

## Important Notes

### ⚠️ Common Error: "Failed to load bundle.js"

**Problem:** You're accessing `http://localhost:5000` directly instead of `http://localhost:3000`

**Solution:**
- In development, always access the app via **http://localhost:3000** (React dev server)
- The backend (port 5000) only serves the React app in production mode
- The React dev server automatically proxies API requests to port 5000

### Development vs Production

**Development Mode:**
- React app runs on port 3000 (with hot reload)
- Backend runs on port 5000
- Access app via: http://localhost:3000
- React dev server proxies `/api/*` requests to backend

**Production Mode:**
- Build the React app: `npm run build`
- Set `NODE_ENV=production`
- Backend serves the built React app
- Access app via: http://localhost:5000

## Troubleshooting

### Error: "bundle.js 404" or "MIME type error"

1. **Make sure you're accessing the correct URL:**
   - Development: http://localhost:3000 ✅
   - NOT: http://localhost:5000 ❌ (unless in production mode)

2. **Check if React dev server is running:**
   ```bash
   # Should see: "webpack compiled successfully"
   npm run client
   ```

3. **Rebuild if needed:**
   ```bash
   cd client
   npm run build
   ```

### Error: "Cannot GET /"

If accessing http://localhost:5000 in development:
- This is normal - the backend doesn't serve the React app in dev mode
- Use http://localhost:3000 instead
- Or run `npm run build` and set `NODE_ENV=production`

### Port Already in Use

If port 3000 or 5000 is already in use:

**For React (port 3000):**
1. Create or edit `client/.env` file:
   ```
   PORT=3001
   BROWSER=none
   ```
2. Restart: `npm run dev`

**For Backend (port 5000):**
1. Create or edit `.env` file in root:
   ```
   PORT=5001
   ```
2. Update `client/package.json` proxy to match:
   ```json
   "proxy": "http://localhost:5001"
   ```
3. Restart: `npm run dev`

**Kill process on port (Windows):**
```powershell
# Find process on port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/electricity-records

# Security
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here

# Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecureAdminPass123!
```

## API Endpoints

- Health Check: http://localhost:5000/api/health
- API Status: http://localhost:5000/api/status
- All API routes: http://localhost:5000/api/*

## Building for Production

```bash
# Build React app
npm run build

# Set production mode
set NODE_ENV=production  # Windows
export NODE_ENV=production  # Mac/Linux

# Start server (will serve React app)
npm start
```

Now you can access the app at http://localhost:5000


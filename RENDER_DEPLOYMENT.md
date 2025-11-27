# Render Deployment Guide

This guide will help you deploy the Electricity Record Management System on Render with both client and server in a single service.

## Prerequisites

1. A GitHub account with the repository pushed
2. A Render account (sign up at https://render.com)
3. A MongoDB Atlas account (or MongoDB database)

## Step 1: Prepare Environment Variables

You'll need the following environment variables:

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A random secret string for JWT tokens (generate a strong random string)
- `NODE_ENV` - Set to `production`
- `PORT` - Render will set this automatically (default: 10000)
- `ADMIN_EMAIL` - Admin email (default: admin@power.local)
- `ADMIN_PASSWORD` - Admin password (default: Admin@1234)

## Step 2: Deploy on Render

### Option A: Using render.yaml (Recommended)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account and select the repository: `Shubhamkumarpatel70/electricrecord`
4. Render will automatically detect the `render.yaml` file
5. Click **"Apply"**
6. Add your environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Generate a strong random string
   - `ADMIN_EMAIL` - Your admin email
   - `ADMIN_PASSWORD` - Your admin password
7. Click **"Create Blueprint"**
8. Render will start building and deploying your application

### Option B: Manual Setup

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select the repository: `Shubhamkumarpatel70/electricrecord`
4. Configure the service:
   - **Name**: `electricity-record-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run install-client && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Choose a plan (Starter is free)
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = Your MongoDB connection string
   - `JWT_SECRET` = A strong random string
   - `ADMIN_EMAIL` = `admin@power.local`
   - `ADMIN_PASSWORD` = `Admin@1234`
6. Click **"Create Web Service"**

## Step 3: Configure MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Whitelist Render's IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get your connection string and add it to Render environment variables

## Step 4: Wait for Deployment

- Render will automatically build and deploy your application
- The build process includes:
  1. Installing server dependencies
  2. Installing client dependencies
  3. Building the React app
  4. Starting the server
- This may take 5-10 minutes for the first deployment

## Step 5: Access Your Application

Once deployed, Render will provide you with a URL like:
- `https://electricity-record-app.onrender.com`

Your application will be accessible at this URL with both frontend and backend running on the same service.

## Step 6: Seed Admin User (Optional)

If you want to create an admin user, you can:

1. SSH into your Render service (if available)
2. Or run the seed script locally with the production MongoDB URI:
   ```bash
   MONGODB_URI=your_production_uri npm run seed
   ```

## Important Notes

1. **Free Tier Limitations**: 
   - Render free tier services spin down after 15 minutes of inactivity
   - First request after spin-down may take 30-60 seconds
   - Consider upgrading to a paid plan for always-on service

2. **Environment Variables**:
   - Never commit `.env` files to GitHub
   - Always set sensitive variables in Render dashboard

3. **Build Time**:
   - First build may take 10-15 minutes
   - Subsequent builds are faster (5-8 minutes)

4. **Health Check**:
   - Health check endpoint: `/api/health`
   - Render will use this to monitor your service

5. **File Uploads**:
   - Uploads are stored in `server/uploads/`
   - On Render, these persist between deployments
   - Consider using cloud storage (AWS S3, Cloudinary) for production

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Application Not Starting
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check server logs in Render dashboard

### CORS Errors
- Update CORS settings in `server/server.js` if needed
- Ensure frontend URL is whitelisted

### Static Files Not Loading
- Verify `client/build` directory exists after build
- Check that build command completed successfully

## Support

For issues, check:
- Render documentation: https://render.com/docs
- Application logs in Render dashboard
- GitHub issues: https://github.com/Shubhamkumarpatel70/electricrecord/issues


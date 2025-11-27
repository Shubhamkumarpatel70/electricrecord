const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const app = express();

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5000;

// Ensure uploads dir exists (inside server/)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: isProduction 
        ? ["'self'", "data:", "https:"]
        : ["'self'", "data:", "https:", "http://localhost:5000", "http://localhost:3000"],
      connectSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded cross-origin
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: isProduction 
    ? [
        process.env.FRONTEND_URL,
        process.env.RENDER_EXTERNAL_URL,
        'https://electricity-record-app.onrender.com',
        'https://electricity-record-frontend.onrender.com', 
        'https://electricity-record.onrender.com'
      ].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Serve static files from uploads directory (inside server/uploads)
// Add CORS headers for cross-origin image requests
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for image requests
  const allowedOrigins = isProduction 
    ? [
        process.env.FRONTEND_URL,
        process.env.RENDER_EXTERNAL_URL,
        'https://electricity-record-app.onrender.com',
        'https://electricity-record-frontend.onrender.com', 
        'https://electricity-record.onrender.com'
      ].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5001', 'http://localhost:5000'];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  maxAge: isProduction ? '1d' : 0,
  etag: true,
  setHeaders: (res, filePath) => {
    // Set additional headers for images
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader('Content-Type', `image/${filePath.split('.').pop()}`);
      res.setHeader('Cache-Control', isProduction ? 'public, max-age=86400' : 'no-cache');
    }
  }
}));

// Database connection with better error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/electricity-records';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Electricity Record API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Electricity Record API',
    version: '1.0.0',
    status: 'operational',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Root route - only show API info in development when React app is not built
// In production, this will be handled by React app serving below

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/records', require('./routes/records'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/admin', require('./routes/admin'));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl,
    availableEndpoints: ['/api/auth', '/api/records', '/api/admin', '/api/health', '/api/status']
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const errorResponse = {
    message: isProduction ? 'Internal server error' : err.message,
    ...(isProduction && { errorId: Date.now() })
  };

  res.status(err.status || 500).json(errorResponse);
});

// Serve React app in production (client folder is one level up)
// Also serve in development if build exists (for testing production build locally)
const clientBuildPath = path.resolve(__dirname, '..', 'client', 'build');
const buildExists = fs.existsSync(clientBuildPath);

if (isProduction || buildExists) {
  // Serve static files from React build (must be before catch-all route)
  // This handles /static/js/*, /static/css/*, /manifest.json, /icon.svg, etc.
  app.use(express.static(clientBuildPath, {
    maxAge: isProduction ? '1y' : 0,
    etag: true,
    setHeaders: (res, filePath) => {
      // Set correct MIME types for JavaScript files
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));

  // Serve index.html for all non-API routes (SPA routing)
  // This must be AFTER static file serving
  app.get('*', (req, res, next) => {
    // Skip API routes - let them fall through to 404 handler
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Serve index.html for all other routes (React Router will handle client-side routing)
    const indexPath = path.resolve(clientBuildPath, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      return res.status(404).json({ 
        error: 'React app not built. Run "npm run build" in the client directory.',
        path: req.path 
      });
    }
    
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to serve application' });
        }
      }
    });
  });
} else if (!isProduction) {
  // In development, if build doesn't exist, provide helpful message
  // But still serve index.html for share routes (they need to work even in dev)
  app.get('/share/*', (req, res) => {
    res.json({
      message: 'Share links require the React app to be running',
      note: 'In development mode, please access share links through the React dev server:',
      instructions: [
        '1. Make sure the React app is running: cd client && npm start',
        '2. Access the share link at: http://localhost:3000' + req.path,
        'Or run both together: npm run dev'
      ],
      currentPath: req.path,
      correctUrl: `http://localhost:3000${req.path}`
    });
  });
  
  app.get('/', (req, res) => {
    res.json({
      message: 'Backend API is running',
      note: 'In development mode, please run the React app separately:',
      instructions: [
        '1. Open a new terminal',
        '2. Run: cd client && npm start',
        '3. Access the app at http://localhost:3000',
        'Or run both together: npm run dev'
      ],
      api: 'http://localhost:5000/api',
      health: 'http://localhost:5000/api/health'
    });
  });
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      if (!isProduction) {
        console.log(`🔗 API: http://localhost:${PORT}/api`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();



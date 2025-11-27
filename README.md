# ⚡ Electricity Record - Professional Smart Meter Management System

A modern, secure, and scalable Progressive Web App (PWA) for managing electricity meter readings and bills with enterprise-grade features.

![Electricity Record App](https://img.shields.io/badge/PWA-Ready-brightgreen) ![React](https://img.shields.io/badge/React-18.0-blue) ![Node.js](https://img.shields.io/badge/Node.js-18.0-green) ![MongoDB](https://img.shields.io/badge/MongoDB-7.0-orange) ![Security](https://img.shields.io/badge/Security-A+%20Grade-brightgreen)

## 🚀 Features

### 🔒 **Enterprise Security**
- **JWT Authentication** with refresh tokens
- **Rate Limiting** and brute force protection
- **Account Lockout** after failed attempts
- **Helmet.js** security headers
- **CORS** protection
- **Input Validation** and sanitization
- **SQL Injection** prevention

### 📱 **Progressive Web App (PWA)**
- **Install to Home Screen** functionality
- **Offline Support** with service worker
- **Push Notifications** ready
- **Responsive Design** for all devices
- **App-like Experience**

### 👥 **User Management**
- **Role-based Access Control** (User/Admin)
- **Secure Authentication** system
- **Profile Management** with validation
- **Account Security** features
- **Session Management**

### 📊 **Meter Reading Management**
- **Smart Validation** and calculations
- **Bill Generation** with configurable rates
- **Payment Tracking** and status management
- **Image Upload** for bill receipts
- **Data Export** (CSV, JSON)
- **Historical Analytics**

### 🎯 **Admin Dashboard**
- **User Management** and monitoring
- **System Analytics** and metrics
- **Bulk Operations** support
- **Advanced Filtering** and search
- **Data Visualization** with charts
- **System Health** monitoring

## 🛠️ Technology Stack

### **Backend (Node.js/Express)**
- **Node.js 18+** - Runtime environment
- **Express.js 4.18+** - Web framework
- **MongoDB 7.0+** - NoSQL database
- **Mongoose 7.5+** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware
- **Rate Limiting** - API protection
- **Compression** - Response optimization

### **Frontend (React)**
- **React 18** - UI framework
- **React Router 6** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications
- **Recharts** - Data visualization
- **Date-fns** - Date manipulation
- **CSS3** - Custom styling with animations

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Husky** - Git hooks
- **Lint-staged** - Pre-commit checks

## 📦 Installation & Setup

### **Prerequisites**
- Node.js 18.0 or higher
- MongoDB 7.0 or higher
- Git
- npm or yarn

### **Quick Start**

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shubhamkumarpatel70/electriccityrecord.git
   cd electriccityrecord
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd client && npm install && cd ..
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB
   mongod
   
   # Seed admin user
   npm run seed
   ```

5. **Start Development Servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually:
   npm run server    # Backend only
   npm run client    # Frontend only
   ```

## 🌐 API Documentation

### **Base URL**
```
Development: http://localhost:5000/api
Production: https://your-api-domain.com/api
```

### **Authentication Endpoints**

#### **POST /api/auth/register**
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "meterNumber": "ABC123456",
  "address": "123 Main Street, City, State 12345",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "meterNumber": "ABC123456"
    }
  }
}
```

#### **POST /api/auth/login**
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

#### **GET /api/auth/me**
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "meterNumber": "ABC123456"
    }
  }
}
```

### **Records Endpoints**

#### **GET /api/records/mine**
Get current user's electricity records (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "record_id",
      "previousReading": 1000,
      "currentReading": 1200,
      "unitsConsumed": 200,
      "ratePerUnit": 8.0,
      "totalAmount": 1600.0,
      "paymentStatus": "pending",
      "dueDate": "2024-01-15T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### **POST /api/records**
Create a new electricity record (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "previousReading": 1000,
  "currentReading": 1200,
  "ratePerUnit": 8.0,
  "dueDate": "2024-01-15",
  "remarks": "Monthly reading"
}
```

### **Admin Endpoints**

#### **GET /api/admin/records**
Get all electricity records (admin only).

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `status` - Filter by payment status
- `page` - Page number for pagination
- `limit` - Records per page

#### **PUT /api/admin/records/:id/payment**
Update payment status (admin only).

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "status": "paid",
  "paymentDate": "2024-01-10"
}
```

### **Health & Status Endpoints**

#### **GET /api/health**
Check API health status.

**Response:**
```json
{
  "status": "OK",
  "message": "Electricity Record API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "uptime": 3600
}
```

#### **GET /api/status**
Get detailed API status.

**Response:**
```json
{
  "service": "Electricity Record API",
  "version": "1.0.0",
  "status": "operational",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Development

### **Available Scripts**

```bash
# Development
npm run dev          # Start both frontend and backend
npm run server       # Start backend server only
npm run client       # Start frontend only

# Building
npm run build        # Build frontend for production
npm run install-client # Install frontend dependencies

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Database
npm run seed         # Create admin user
```

### **Code Quality Standards**

- **ESLint** configuration for consistent code style
- **Prettier** for automatic code formatting
- **Husky** git hooks for pre-commit checks
- **Jest** testing framework with coverage reporting
- **TypeScript** ready (can be added later)

## 🚀 Deployment

### **Environment Variables**

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/electricity-records

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret

# Admin User
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=SecureAdminPass123!

# Frontend
FRONTEND_URL=https://yourdomain.com
```

### **Production Deployment**

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=your_mongodb_connection_string
   export JWT_SECRET=your_jwt_secret
   ```

3. **Start the server**
   ```bash
   npm start
   ```

### **Docker Deployment**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

## 📊 Performance & Monitoring

### **Performance Features**
- **Response Compression** with gzip
- **Static File Caching** with ETags
- **Database Indexing** for optimal queries
- **Rate Limiting** to prevent abuse
- **Request Logging** for monitoring

### **Health Monitoring**
- **Health Check Endpoints** for load balancers
- **Database Connection** monitoring
- **Request/Response** timing
- **Error Tracking** and logging
- **Uptime Monitoring**

## 🔒 Security Features

### **Authentication & Authorization**
- **JWT Tokens** with configurable expiration
- **Password Hashing** with bcrypt
- **Account Lockout** after failed attempts
- **Role-based Access Control**
- **Session Management**

### **API Security**
- **Rate Limiting** per IP address
- **CORS Protection** with configurable origins
- **Input Validation** and sanitization
- **SQL Injection** prevention
- **XSS Protection** with Helmet.js

### **Data Protection**
- **Password Requirements** (8+ chars, mixed case, symbols)
- **Email Validation** and normalization
- **Phone Number** format validation
- **Meter Number** format validation
- **Address Length** restrictions

## 🧪 Testing

### **Test Coverage**
- **Unit Tests** for models and utilities
- **Integration Tests** for API endpoints
- **End-to-End Tests** for user workflows
- **Security Tests** for authentication
- **Performance Tests** for load handling

### **Running Tests**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=auth.test.js
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Make your changes** following our coding standards
4. **Run tests** to ensure everything works
5. **Commit your changes** (`git commit -m 'Add AmazingFeature'`)
6. **Push to the branch** (`git push origin feature/AmazingFeature`)
7. **Open a Pull Request**

### **Coding Standards**
- Follow ESLint configuration
- Use Prettier for formatting
- Write tests for new features
- Update documentation as needed
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Shubham Kumar Patel**

- GitHub: [@Shubhamkumarpatel70](https://github.com/Shubhamkumarpatel70)
- LinkedIn: [Your LinkedIn]
- Email: [your.email@domain.com]

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB team for the robust database
- Express.js team for the web framework
- PWA community for progressive web app standards
- All contributors and users of this project

## 📞 Support

- **Documentation**: [Project Wiki]
- **Issues**: [GitHub Issues]
- **Discussions**: [GitHub Discussions]
- **Email**: [support@yourdomain.com]

---

⭐ **Star this repository if you find it helpful!**

🔗 **Check out our live demo**: [Demo Link]

📚 **API Documentation**: [API Docs Link]

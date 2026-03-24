
# Tuition App- REST API

 REST API backend for managing tuition app operations, built with Node.js, Express, and MongoDB.



## Start

### 1. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 2. Start Server
``` bash
npm run dev
```
### 3. Test API
``` bash
curl http://localhost:3001/health
```

## Key Features

- Password-Based Authentication - with OTP verification  
- Role-Based Access Control - (Admin, Teacher, Student, Parent)  
- Academic Structure Management - (Board → Subject → Chapter → Concept)  
- Student Work Upload - with cloud storage  
- Teacher Feedback System
- Parent-Student & Teacher-Student Linking
- Role-Specific Dashboards
- Comprehensive Security - (bcrypt, JWT, rate limiting)  

## API Endpoints Summary

- Authentication: 7 endpoints (Register, Login, Forgot Password, etc.)
- User Management: 4 endpoints
- Academic Structure: 20 endpoints (Boards, Subjects, Chapters, Concepts)
- Student Work: 3 endpoints
- Teacher Feedback: 3 endpoints
- Linking: 6 endpoints (Parent-Student, Teacher-Student)
- Dashboards: 4 endpoints (Admin, Teacher, Student, Parent)

**Total: 50+ endpoints**

## Technology Stack

- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT, bcrypt
- File Upload: Cloudinary
- Communication: Nodemailer, Twilio
- Security: Helmet, express-rate-limit
- Logging: Winston


## Environment Variables

Key variables needed in `.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/tuition_center

# JWT Secrets
JWT_ACCESS_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-secret-min-32-chars

# Server
PORT=3001
NODE_ENV=development
```

See `.env.example` for complete list.



## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT tokens (Access: 15min, Refresh: 30 days)
- OTP verification (10-minute expiry)
- Account lockout (5 failed attempts = 30-minute lockout)
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- Role-based access control
- Secure file upload (10MB limit, PDF/JPEG/PNG only)


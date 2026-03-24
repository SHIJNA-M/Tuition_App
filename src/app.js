const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

/**
 * Express Application Setup with Security Middleware
 * Requirements: 21.5
 */

const app = express();

// Security middleware - helmet
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.server.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Root endpoint - API information
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tuition Center Management System API',
    version: '1.0.0',
    
    endpoints: {
      health: '/health',
      authentication: '/api/auth/*',
      users: '/api/users/*',
      academic: '/api/boards, /api/subjects, /api/chapters, /api/concepts',
      studentWork: '/api/student-work/*',
      feedback: '/api/feedback/*',
      linking: '/api/links/*',
      dashboards: '/api/dashboard/*'
    }
    
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes will be mounted here
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const academicRoutes = require('./routes/academicRoutes');
const studentWorkRoutes = require('./routes/studentWorkRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const linkRoutes = require('./routes/linkRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', academicRoutes);
app.use('/api/student-work', studentWorkRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { errorHandler } = require('./utils/errorHandler');
const { ERROR_MESSAGES } = require('./utils/constants');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

// Connect to MongoDB first
connectDB();

// Import all models after database connection
// This ensures models are registered with the connected mongoose instance
const models = require('./models');

// Initialize Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers

// CORS configuration - Environment-specific origin handling
const isDevelopment = process.env.NODE_ENV === 'development';

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      callback(null, true);
      return;
    }

    // In development: allow everything
    if (isDevelopment) {
      callback(null, true);
      return;
    }

    // In production: only allow skyprepaero.com and its subdomains
    const skyprepDomainPattern = /^https?:\/\/([\w-]+\.)?skyprepaero\.com(?::\d+)?$/;
    if (skyprepDomainPattern.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SkyPrep API Documentation'
}));

// API Routes
const apiVersion = process.env.API_VERSION || 'v1';
const routes = require('./routes');
app.use(`/api/${apiVersion}`, routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to SkyPrep API',
    version: apiVersion,
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      swagger: '/api-docs',
      users: `/api/${apiVersion}/users`,
      auth: `/api/${apiVersion}/auth`,
      subjects: `/api/${apiVersion}/subjects`,
      chapters: `/api/${apiVersion}/chapters`,
      questions: `/api/${apiVersion}/questions`,
      options: `/api/${apiVersion}/options`
    }
  });
});

// Test endpoint to check models
app.get('/test-models', async (req, res) => {
  try {
    const Subject = require('./models/Subject');
    const count = await Subject.countDocuments();
    res.json({
      success: true,
      message: 'Models are working',
      subjectCount: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Model error',
      error: error.message
    });
  }
});

// 404 handler - must be before error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: ERROR_MESSAGES.ROUTE_NOT_FOUND
  });
});

// Global Error handling middleware - must be last
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`API Version: ${apiVersion}`);
  console.log(`Server URL: http://localhost:${PORT}`);
});

module.exports = app;


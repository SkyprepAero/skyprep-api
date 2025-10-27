require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { errorHandler } = require('./utils/errorHandler');
const { ERROR_MESSAGES } = require('./utils/constants');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

// Import all models to ensure they are registered with Mongoose
require('./models');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
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
      auth: `/api/${apiVersion}/auth`
    }
  });
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


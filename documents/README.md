# SkyPrep API Documentation

This folder contains comprehensive documentation for the SkyPrep API.

## 📄 Available Documents

### 1. API_DOCUMENTATION.md
Complete API reference with all endpoints, request/response examples, and error codes.

**Contents:**
- Authentication endpoints (register, login, get user)
- User management endpoints (CRUD operations)
- Request/response examples
- Error handling
- HTTP status codes
- cURL and JavaScript examples

### 2. POSTMAN_COLLECTION.json
Postman collection for easy API testing.

**How to use:**
1. Open Postman
2. Click "Import"
3. Select `POSTMAN_COLLECTION.json`
4. Collection will be imported with all endpoints
5. Variables are pre-configured:
   - `base_url`: http://localhost:5000
   - `api_version`: v1
   - `token`: Auto-populated after login

**Features:**
- All API endpoints pre-configured
- Automatic token management
- Test scripts included
- Ready to use

### 3. Swagger UI
Interactive API documentation available at: **`/api-docs`**

**Access:**
- Development: http://localhost:5000/api-docs
- Production: https://api.skyprep.com/api-docs

**Features:**
- Interactive API explorer
- Try out endpoints directly
- Schema definitions
- Authentication testing
- Request/response examples

## 🚀 Quick Start

### Option 1: Swagger UI (Recommended for exploration)
1. Start the server: `npm run dev`
2. Open browser: http://localhost:5000/api-docs
3. Explore and test endpoints interactively

### Option 2: Postman (Recommended for testing)
1. Import `POSTMAN_COLLECTION.json` into Postman
2. Update variables if needed
3. Start testing endpoints

### Option 3: Manual Testing
Refer to `API_DOCUMENTATION.md` for detailed endpoint information and cURL examples.

## 📊 API Overview

### Base URL
```
Development: http://localhost:5000
Production: https://api.skyprep.com
```

### API Version
Current version: `v1`

All endpoints are prefixed with `/api/v1`

### Authentication
JWT Bearer token required for protected endpoints:
```
Authorization: Bearer <your_jwt_token>
```

## 🔗 Endpoints Summary

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user (protected)

### Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get single user
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### System
- `GET /health` - Health check
- `GET /` - API information
- `GET /api-docs` - Swagger documentation

## 📝 Examples

### Register a User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Current User (with token)
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security

- All passwords are hashed using bcryptjs
- JWT tokens expire after 7 days (configurable)
- Role-based authorization supported
- Input validation on all endpoints
- Security headers via Helmet
- CORS configured

## 🛠️ Development

### Add New Endpoints
1. Create route file in `src/routes/`
2. Create controller in `src/controllers/`
3. Add Swagger documentation comments
4. Register route in `src/server.js`
5. Update this documentation

### Swagger Documentation Format
```javascript
/**
 * @swagger
 * /api/v1/endpoint:
 *   post:
 *     summary: Endpoint description
 *     tags: [TagName]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchemaName'
 *     responses:
 *       200:
 *         description: Success response
 */
```

## 📚 Additional Resources

- Main README: `../README.md`
- Setup Guide: `../SETUP_GUIDE.md`
- Package Info: `../package.json`

## 🤝 Support

For questions or issues:
1. Check the API documentation
2. Try the Swagger UI
3. Review the setup guide
4. Check environment variables

## 📄 License

ISC






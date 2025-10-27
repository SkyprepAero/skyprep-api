# SkyPrep API - Complete API Documentation

## Base URL
```
Development: http://localhost:5000
Production: https://api.skyprep.com
```

## Swagger UI
Interactive API documentation is available at: **`/api-docs`**

Example: http://localhost:5000/api-docs

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### 🔐 Authentication Endpoints

#### 1. Register User
**POST** `/api/v1/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64a7b8c9d12e3f4g5h6i7j8k",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules:**
- `name`: Required, max 50 characters
- `email`: Required, valid email format
- `password`: Required, min 6 characters, max 128 characters

**Error Responses:**
- `400 Bad Request` - Validation error or user already exists
- `500 Internal Server Error` - Server error

---

#### 2. Login User
**POST** `/api/v1/auth/login`

Authenticate and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64a7b8c9d12e3f4g5h6i7j8k",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules:**
- `email`: Required, valid email format
- `password`: Required

**Error Responses:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid credentials or account deactivated
- `500 Internal Server Error` - Server error

---

#### 3. Get Current User
**GET** `/api/v1/auth/me`

Get details of the currently authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "64a7b8c9d12e3f4g5h6i7j8k",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 👥 User Management Endpoints

#### 4. Get All Users
**GET** `/api/v1/users`

Retrieve a list of all users.

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "64a7b8c9d12e3f4g5h6i7j8k",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "64a7b8c9d12e3f4g5h6i7j8l",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "admin",
      "isActive": true,
      "createdAt": "2024-01-02T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `500 Internal Server Error` - Server error

---

#### 5. Get Single User
**GET** `/api/v1/users/:id`

Retrieve a specific user by ID.

**URL Parameters:**
- `id` (string, required) - User ID

**Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "64a7b8c9d12e3f4g5h6i7j8k",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid ID format
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

#### 6. Create User
**POST** `/api/v1/users`

Create a new user account.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "admin"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "64a7b8c9d12e3f4g5h6i7j8l",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-02T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Validation Rules:**
- `name`: Required, max 50 characters
- `email`: Required, valid email format
- `password`: Required, min 6 characters
- `role`: Optional, must be "user" or "admin"

**Error Responses:**
- `400 Bad Request` - Validation error or user already exists
- `500 Internal Server Error` - Server error

---

#### 7. Update User
**PUT** `/api/v1/users/:id`

Update an existing user.

**URL Parameters:**
- `id` (string, required) - User ID

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "johnupdated@example.com",
  "role": "admin",
  "isActive": false
}
```

*Note: All fields are optional. Only include fields you want to update.*

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "64a7b8c9d12e3f4g5h6i7j8k",
    "name": "John Updated",
    "email": "johnupdated@example.com",
    "role": "admin",
    "isActive": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-03T00:00:00.000Z"
  }
}
```

**Validation Rules:**
- `name`: Optional, max 50 characters
- `email`: Optional, valid email format
- `role`: Optional, must be "user" or "admin"
- `isActive`: Optional, boolean

**Error Responses:**
- `400 Bad Request` - Validation error or invalid ID
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

#### 8. Delete User
**DELETE** `/api/v1/users/:id`

Delete a user account.

**URL Parameters:**
- `id` (string, required) - User ID

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {}
}
```

**Error Responses:**
- `400 Bad Request` - Invalid ID format
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

### 🏥 Health Check

#### 9. Health Check
**GET** `/health`

Check if the API server is running.

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "development"
}
```

---

## Error Response Format

All errors follow this standard format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

### Validation Errors

Validation errors include an `errors` array:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters long"
    }
  ]
}
```

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource (e.g., email already exists) |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting

Currently, there is no rate limiting implemented. It's recommended to add rate limiting in production.

---

## CORS

CORS is enabled for the origin specified in the `CORS_ORIGIN` environment variable.

---

## Examples

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get Current User:**
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using JavaScript (Fetch API)

**Register:**
```javascript
const response = await fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  })
});
const data = await response.json();
console.log(data);
```

**Login:**
```javascript
const response = await fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
});
const data = await response.json();
const token = data.data.token;
```

**Get Current User:**
```javascript
const response = await fetch('http://localhost:5000/api/v1/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
console.log(data);
```

---

## Best Practices

1. **Always use HTTPS in production**
2. **Keep JWT tokens secure** - Never expose in URLs or logs
3. **Set strong JWT_SECRET** - Use a long, random string
4. **Implement rate limiting** - Prevent abuse
5. **Validate all inputs** - Already implemented with express-validator
6. **Use environment variables** - Never hardcode sensitive data
7. **Monitor and log** - Track API usage and errors
8. **Keep dependencies updated** - Regularly update npm packages

---

## Support

For issues or questions, please refer to the main README.md or SETUP_GUIDE.md files.



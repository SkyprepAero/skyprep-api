# Admin Module

This directory contains all admin-related functionality, including admin user registration and management.

## Structure

```
admin/
├── routes.js      # Admin route definitions
├── controller.js  # Admin request handlers
├── service.js     # Admin business logic
├── validation.js  # Admin input validation rules
└── README.md      # This file
```

## Routes

### Register Admin User
**POST** `/api/v1/auth/admin/register`

Register a new admin user with the `admin` role automatically assigned.

**Request Body:**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "SecurePass123",
  "phoneNumber": "+1234567890",  // Optional
  "city": "New York"              // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "Admin User",
      "email": "admin@example.com",
      "roles": [...],
      "primaryRole": {...}
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenExpiresAt": "2024-01-01T12:00:00.000Z"
  }
}
```

## Features

- **Automatic Role Assignment**: Admin role is automatically assigned
- **Optional Phone Number**: Phone number is not required
- **JWT Token**: Returns JWT token for immediate authentication
- **Validation**: Comprehensive input validation

## Adding New Admin Features

When adding new admin functionality:

1. Add route to `routes.js`
2. Add controller function to `controller.js`
3. Add service logic to `service.js`
4. Add validation rules to `validation.js`
5. Update this README with new endpoints


# Error Codes System

This folder contains the application's error code system.

## Structure

```
errors/
├── errorCodes.js      # All application error codes
├── AppError.js        # Custom error class
├── index.js           # Centralized exports
└── README.md          # This file
```

## Error Code Format

Error codes follow this pattern: `CATEGORY_NUMBER`

- **AUTH_xxxx** (1000-1999) - Authentication errors
- **USER_xxxx** (2000-2999) - User-related errors
- **PERM_xxxx** (3000-3999) - Permission/Authorization errors
- **VAL_xxxx** (4000-4999) - Validation errors
- **DB_xxxx** (5000-5999) - Database errors
- **SRV_xxxx** (9000-9999) - Server errors

## Usage

### Import Error Codes
```javascript
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');
```

### Throw Custom Error
```javascript
// Simple error
throw new AppError(
  ERROR_CODES.USER.NOT_FOUND,
  HTTP_STATUS.NOT_FOUND
);

// Error with additional details
throw new AppError(
  ERROR_CODES.AUTH.INVALID_CREDENTIALS,
  HTTP_STATUS.UNAUTHORIZED,
  { attemptedEmail: email }
);
```

### Error Response Format

When an error is thrown, the API responds with:

```json
{
  "success": false,
  "error": {
    "code": "USER_2001",
    "message": "User not found",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

With details:
```json
{
  "success": false,
  "error": {
    "code": "AUTH_1001",
    "message": "Invalid email or password",
    "details": {
      "attemptedEmail": "test@example.com"
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Available Error Codes

### Authentication (AUTH_)
- `AUTH_1001` - Invalid credentials
- `AUTH_1002` - Token missing
- `AUTH_1003` - Token invalid
- `AUTH_1004` - Token expired
- `AUTH_1005` - Unauthorized
- `AUTH_1006` - Account deactivated
- `AUTH_1007` - Account locked

### User (USER_)
- `USER_2001` - User not found
- `USER_2002` - User already exists
- `USER_2003` - Invalid user ID
- `USER_2004` - Update failed
- `USER_2005` - Delete failed
- `USER_2006` - Creation failed

### Permissions (PERM_)
- `PERM_3001` - Forbidden
- `PERM_3002` - Insufficient role
- `PERM_3003` - Admin only

### Validation (VAL_)
- `VAL_4001` - General validation error
- `VAL_4002` - Required field missing
- `VAL_4003` - Invalid format
- `VAL_4004` - Invalid email
- `VAL_4005` - Password too short
- `VAL_4006` - Invalid role

### Database (DB_)
- `DB_5001` - Connection failed
- `DB_5002` - Query failed
- `DB_5003` - Duplicate key
- `DB_5004` - Cast error
- `DB_5005` - Validation error

### Server (SRV_)
- `SRV_9001` - Internal error
- `SRV_9002` - Not found
- `SRV_9003` - Method not allowed
- `SRV_9004` - Service unavailable

## Adding New Error Codes

1. Open `errorCodes.js`
2. Add to appropriate category or create new category
3. Follow naming convention: `CATEGORY_NUMBER`
4. Include code and message

Example:
```javascript
PRODUCT: {
  NOT_FOUND: { code: 'PROD_6001', message: 'Product not found' },
  OUT_OF_STOCK: { code: 'PROD_6002', message: 'Product is out of stock' }
}
```

## Benefits

1. **Consistency** - All errors follow the same format
2. **Client-friendly** - Error codes help clients handle errors programmatically
3. **Debugging** - Easy to track specific errors
4. **Documentation** - Clear error catalog
5. **Localization** - Easy to translate error messages
6. **Monitoring** - Track error frequencies by code

## Examples

### In Controllers
```javascript
const { AppError, ERROR_CODES } = require('../errors');
const { HTTP_STATUS } = require('../utils/constants');

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new AppError(
      ERROR_CODES.USER.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }
  
  res.json({ success: true, data: user });
});
```

### In Middleware
```javascript
if (!token) {
  throw new AppError(
    ERROR_CODES.AUTH.TOKEN_MISSING,
    HTTP_STATUS.UNAUTHORIZED
  );
}
```

## Best Practices

1. **Use specific error codes** - Don't always use generic errors
2. **Don't expose sensitive data** - Be careful with error details
3. **Log errors** - Keep server logs separate from client responses
4. **Document new codes** - Update this README when adding codes
5. **Be consistent** - Follow the established patterns













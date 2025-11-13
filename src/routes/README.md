# Routes

This folder contains all API route definitions.

## Structure

```
routes/
├── index.js           # Central route registry (imports all routes)
├── authRoutes.js      # Authentication routes
├── userRoutes.js      # User management routes
└── README.md          # This file
```

## Centralized Routes Pattern

All routes are registered in `index.js` and mounted in `server.js` with a single import:

```javascript
// server.js
const routes = require('./routes');
app.use(`/api/${apiVersion}`, routes);
```

This approach provides:
- **Clean server.js** - Only one route import
- **Easy maintenance** - Add new routes in one place
- **Scalability** - Easy to add more route modules
- **Clear structure** - All routes visible in index.js

## Adding New Routes

### 1. Create Route File
Create a new file (e.g., `productRoutes.js`):

```javascript
const express = require('express');
const router = express.Router();
const { getProducts, createProduct } = require('../controllers/productController');

router.get('/', getProducts);
router.post('/', createProduct);

module.exports = router;
```

### 2. Register in index.js
Add to `routes/index.js`:

```javascript
const productRoutes = require('./productRoutes');
router.use('/products', productRoutes);
```

That's it! The route is now available at `/api/v1/products`

## Current Routes

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (protected)

### Users (`/api/v1/users`)
- `GET /` - Get all users
- `GET /:id` - Get single user
- `POST /` - Create user
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user

## Route Organization Best Practices

1. **One resource per file** - Each route file should handle one resource (users, products, etc.)
2. **Use route prefixes** - Mount routes with their prefix in index.js
3. **Add Swagger docs** - Document each route with Swagger comments
4. **Apply middleware** - Add validation and auth middleware at route level
5. **Keep controllers separate** - Routes only handle routing, logic goes in controllers

## Example Route with All Features

```javascript
/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/',
  protect,                    // Authentication middleware
  authorize('admin'),         // Authorization middleware
  getUsers                    // Controller
);
```

## Testing Routes

Use the Swagger UI at `/api-docs` or test with curl:

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```













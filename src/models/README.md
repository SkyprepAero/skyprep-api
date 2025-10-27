# Models

This folder contains all Mongoose models (database schemas).

## Structure

```
models/
├── index.js       # Central model registry (exports all models)
├── User.js        # User model
└── README.md      # This file
```

## Centralized Models Pattern

All models are exported from `index.js` for consistent imports:

```javascript
// Before (direct import)
const User = require('../models/User');
const Product = require('../models/Product');

// After (centralized import)
const { User, Product } = require('../models');
```

## Benefits

1. **Consistency** - All imports use the same pattern
2. **Maintainability** - Easy to see all models in one place
3. **Refactoring** - Change file names without updating all imports
4. **Clean code** - Shorter, more readable imports

## Current Models

### User Model
Location: `models/User.js`

**Schema:**
```javascript
{
  name: String (required, max 50 chars),
  email: String (required, unique, validated),
  password: String (required, hashed, min 6 chars),
  role: String (enum: ['user', 'admin'], default: 'user'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Methods:**
- `comparePassword(enteredPassword)` - Compare plain password with hashed

**Middleware:**
- Pre-save: Hash password if modified
- Pre-save: Update updatedAt timestamp

## Adding New Models

### 1. Create Model File

Create `src/models/Product.js`:

```javascript
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price']
  },
  description: String,
  category: {
    type: String,
    required: true
  },
  inStock: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
```

### 2. Register in index.js

Add to `models/index.js`:

```javascript
const User = require('./User');
const Product = require('./Product');

module.exports = {
  User,
  Product
};
```

### 3. Use in Controllers

```javascript
const { User, Product } = require('../models');

// Now you can use both models
const product = await Product.create({ ... });
const user = await User.findById(userId);
```

## Model Best Practices

1. **Validation** - Add validators at schema level
2. **Indexes** - Add indexes for frequently queried fields
3. **Virtuals** - Use virtuals for computed properties
4. **Methods** - Add instance methods for document-specific logic
5. **Statics** - Add static methods for model-level logic
6. **Middleware** - Use pre/post hooks for side effects
7. **Population** - Use populate for referenced documents

## Example: Adding Indexes

```javascript
// Single field index
userSchema.index({ email: 1 });

// Compound index
productSchema.index({ category: 1, price: -1 });

// Text index for search
productSchema.index({ name: 'text', description: 'text' });
```

## Example: Virtual Properties

```javascript
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});
```

## Example: Static Methods

```javascript
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email });
};

// Usage
const user = await User.findByEmail('test@example.com');
```

## Example: Instance Methods

```javascript
userSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET);
};

// Usage
const token = user.generateAuthToken();
```

## References Between Models

```javascript
// Product references User
const productSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // References User model
  }
});

// Query with population
const product = await Product.findById(id).populate('createdBy');
// product.createdBy will contain full user object
```

## Timestamps

Enable automatic timestamps:

```javascript
const schema = new mongoose.Schema({
  // fields...
}, {
  timestamps: true  // Adds createdAt and updatedAt
});
```

## Schema Options

```javascript
const schema = new mongoose.Schema({
  // fields...
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  versionKey: false  // Removes __v field
});
```

## Testing Models

Test models independently:

```javascript
const { User } = require('../models');

// Create test user
const testUser = await User.create({
  name: 'Test User',
  email: 'test@test.com',
  password: 'test123'
});

// Test methods
const isMatch = await testUser.comparePassword('test123');
console.log(isMatch); // true
```






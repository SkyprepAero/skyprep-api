# JWT with Roles & Permissions Guide

Complete guide on how JWT tokens work with the RBAC system.

## 🎯 JWT Token Structure

### Token Payload
```javascript
{
  id: "user_id_here",
  roles: ["admin", "teacher"],
  primaryRole: "admin",
  permissions: [
    "user:create",
    "user:read",
    "user:update",
    "course:create",
    ...
  ],
  iat: 1234567890,  // Issued at
  exp: 1234567890   // Expires at
}
```

### Token Response (Login/Register)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "roles": [
        {
          "id": "role_id",
          "name": "admin",
          "displayName": "Administrator",
          "level": 8
        }
      ],
      "primaryRole": {
        "id": "role_id",
        "name": "admin",
        "displayName": "Administrator"
      },
      "permissions": [
        "user:create",
        "user:read",
        "user:update",
        ...
      ]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 🔐 Super Admin Privileges

### Automatic Bypass

Super admin **bypasses ALL checks**:

```javascript
// Super admin can access ANY endpoint
// No role check needed
// No permission check needed
// Full system access

if (req.isSuperAdmin) {
  // Skip all authorization checks
  return next();
}
```

### What Gets Bypassed

1. **Role Checks** (`authorize()`)
   ```javascript
   router.get('/admin-only', protect, authorize('admin'), handler);
   // ✅ Super admin can access WITHOUT admin role
   ```

2. **Permission Checks** (`can()`)
   ```javascript
   router.post('/courses', protect, can('course:create'), handler);
   // ✅ Super admin can access WITHOUT course:create permission
   ```

3. **Multiple Role Checks** (`authorizeAll()`)
   ```javascript
   router.get('/special', protect, authorizeAll('admin', 'teacher'), handler);
   // ✅ Super admin can access WITHOUT both roles
   ```

### Super Admin Detection

Every protected request gets `req.isSuperAdmin`:

```javascript
// In your controllers
exports.someAction = asyncHandler(async (req, res) => {
  if (req.isSuperAdmin) {
    // Special handling for super admin
    console.log('Super admin action detected!');
  }
  
  // Normal logic
});
```

## 📊 Request Flow

### 1. Login/Register
```
User → POST /auth/login
        ↓
   Verify credentials
        ↓
   Load user with roles & permissions
        ↓
   Generate JWT with payload:
   - id
   - roles (names array)
   - primaryRole (name)
   - permissions (names array)
        ↓
   Return token + user data
```

### 2. Protected Request
```
Client → GET /api/v1/users
         (Header: Authorization: Bearer TOKEN)
                ↓
         Verify JWT token
                ↓
         Load user from database
         (with roles & permissions)
                ↓
         Check: req.isSuperAdmin = user has 'super-admin' role?
                ↓
         Attach to req.user
         Attach to req.isSuperAdmin
         Attach to req.tokenData
                ↓
         Continue to authorization checks
```

### 3. Authorization Check
```
authorize('admin') middleware
        ↓
   Check: Is super admin?
        ↓ YES
   BYPASS - Allow access
        ↓ NO
   Check: Has 'admin' role?
        ↓ YES
   Allow access
        ↓ NO
   Reject (403 Forbidden)
```

## 🛠️ Available Middleware

### 1. `protect` - Authentication
```javascript
router.get('/profile', protect, getProfile);

// What it does:
// - Verifies JWT token
// - Loads user with roles & permissions
// - Sets req.user, req.isSuperAdmin, req.tokenData
// - Checks if account is active
```

### 2. `authorize()` - Role Check (OR logic)
```javascript
router.get('/staff', protect, authorize('admin', 'teacher'), handler);

// What it does:
// - Bypasses if super admin
// - Checks if user has ANY of the specified roles
// - Rejects if no matching role
```

### 3. `authorizeAll()` - Role Check (AND logic)
```javascript
router.get('/special', protect, authorizeAll('admin', 'teacher'), handler);

// What it does:
// - Bypasses if super admin
// - Checks if user has ALL specified roles
// - Rejects if missing any role
```

### 4. `can()` - Permission Check
```javascript
router.post('/courses', protect, can('course:create'), handler);

// What it does:
// - Bypasses if super admin
// - Checks if user has the permission
// - Checks across all user's roles
// - Rejects if no permission found
```

### 5. `requireSuperAdmin` - Super Admin Only
```javascript
const { requireSuperAdmin } = require('../middleware/superAdmin');

router.delete('/system', protect, requireSuperAdmin, handler);

// What it does:
// - Requires super admin role
// - Does NOT bypass (enforces super admin)
// - Use for critical system operations
```

## 💻 Usage Examples

### Example 1: Check User Role in Controller
```javascript
exports.getData = asyncHandler(async (req, res) => {
  // Super admin gets all data
  if (req.isSuperAdmin) {
    const allData = await Model.find();
    return successResponse(res, HTTP_STATUS.OK, 'Data retrieved', allData);
  }
  
  // Regular users get filtered data
  const filteredData = await Model.find({ userId: req.user.id });
  successResponse(res, HTTP_STATUS.OK, 'Data retrieved', filteredData);
});
```

### Example 2: Check Permission in Controller
```javascript
exports.updateUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  
  // Super admin can update anyone
  if (req.isSuperAdmin) {
    // Update without restrictions
    await targetUser.updateOne(req.body);
    return successResponse(res, HTTP_STATUS.OK, 'User updated');
  }
  
  // Regular users can only update themselves
  if (req.user.id !== targetUser.id) {
    throw new AppError(
      ERROR_CODES.PERMISSION.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN
    );
  }
  
  await targetUser.updateOne(req.body);
  successResponse(res, HTTP_STATUS.OK, 'User updated');
});
```

### Example 3: Different Data Based on Role
```javascript
exports.getDashboard = asyncHandler(async (req, res) => {
  const dashboard = {};
  
  if (req.isSuperAdmin) {
    // Super admin sees everything
    dashboard.users = await User.countDocuments();
    dashboard.revenue = await getRevenue();
    dashboard.systemHealth = await getSystemHealth();
  } else if (await req.user.hasRole('teacher')) {
    // Teacher sees their classes
    dashboard.classes = await Class.find({ teacher: req.user.id });
    dashboard.students = await getStudentCount(req.user.id);
  } else if (await req.user.hasRole('student')) {
    // Student sees their progress
    dashboard.courses = await getUserCourses(req.user.id);
    dashboard.progress = await getUserProgress(req.user.id);
  }
  
  successResponse(res, HTTP_STATUS.OK, 'Dashboard data', dashboard);
});
```

## 🔄 Token Refresh Flow

### When to Refresh Token

Tokens expire after 7 days (configurable). User needs to login again.

### Future: Refresh Token System

```javascript
// Can be implemented later
{
  accessToken: "short-lived (15min)",
  refreshToken: "long-lived (7 days)"
}
```

## 📝 Frontend Integration

### Store Token
```javascript
// After login
const { token } = response.data.data;
localStorage.setItem('token', token);
```

### Include in Requests
```javascript
// Axios
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Fetch
fetch('/api/v1/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Decode Token (Frontend)
```javascript
// Using jwt-decode library
import jwtDecode from 'jwt-decode';

const token = localStorage.getItem('token');
const decoded = jwtDecode(token);

console.log(decoded.roles);       // ['admin', 'teacher']
console.log(decoded.permissions); // ['user:create', ...]

// Check if super admin
const isSuperAdmin = decoded.roles.includes('super-admin');
```

### Hide/Show UI Based on Roles
```javascript
// React example
function AdminPanel() {
  const token = localStorage.getItem('token');
  const { roles } = jwtDecode(token);
  
  const isSuperAdmin = roles.includes('super-admin');
  const isAdmin = roles.includes('admin');
  
  return (
    <div>
      {(isSuperAdmin || isAdmin) && (
        <button>Admin Action</button>
      )}
      
      {isSuperAdmin && (
        <button>Super Admin Only</button>
      )}
    </div>
  );
}
```

## 🔒 Security Considerations

### 1. Token Size
JWT tokens with roles/permissions are larger. Consider:
- Using role names (not full objects)
- Caching user data on backend
- Implementing token refresh

### 2. Token Expiration
```javascript
// In .env
JWT_EXPIRE=7d  // 7 days

// User must login again after expiration
```

### 3. Role Changes
If user's roles change:
- Token still has old roles until expiration
- User must login again to get updated token
- Or implement token refresh mechanism

### 4. Super Admin Audit
```javascript
// Logs all super admin actions
if (req.isSuperAdmin) {
  console.log('[SUPER-ADMIN]', {
    user: req.user.email,
    action: req.method + ' ' + req.originalUrl,
    timestamp: new Date()
  });
}
```

## ⚡ Performance Tips

1. **Cache User Data**
   ```javascript
   // Cache populated user data in Redis
   // Reduce database queries
   ```

2. **Selective Population**
   ```javascript
   // Only populate when needed
   // Don't always populate all permissions
   ```

3. **Token Validation**
   ```javascript
   // JWT verification is fast (cryptographic)
   // Database query is slower (user lookup)
   ```

## 🆘 Troubleshooting

**Issue**: Token doesn't include new role
- **Solution**: User must login again to get updated token

**Issue**: Super admin still getting forbidden
- **Solution**: Check `req.isSuperAdmin` is being set in protect middleware

**Issue**: Token too large
- **Solution**: Store only role names, not full objects

**Issue**: Permission check fails for super admin
- **Solution**: Ensure `req.isSuperAdmin` check is BEFORE permission check

## 📊 Request Object Structure

After `protect` middleware:

```javascript
req.user = {
  _id: ObjectId,
  name: String,
  email: String,
  roles: [{ _id, name, displayName, level, permissions: [...] }],
  primaryRole: { _id, name, displayName },
  isActive: Boolean,
  // ... other user fields
  
  // Methods
  hasRole: async Function,
  hasPermission: async Function,
  getAllPermissions: async Function
}

req.isSuperAdmin = Boolean  // Quick check

req.tokenData = {
  id: String,
  roles: [String],
  primaryRole: String,
  permissions: [String],
  iat: Number,
  exp: Number
}
```

---

**Super Admin has god-mode enabled!** 🦸‍♂️✨










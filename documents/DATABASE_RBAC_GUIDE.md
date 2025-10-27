
# Database-Driven RBAC System

Complete guide for the database-driven Role-Based Access Control (RBAC) system.

## 🎯 Architecture Overview

The system uses **three interconnected collections** in MongoDB:

```
┌─────────────┐       ┌──────────┐       ┌──────────────┐
│    User     │──────▶│   Role   │──────▶│  Permission  │
└─────────────┘ many  └──────────┘ many  └──────────────┘
     roles[]            permissions[]
```

### Collection Structure

1. **Users** - Reference multiple roles
2. **Roles** - Reference multiple permissions
3. **Permissions** - Granular access controls

## 📊 Database Schemas

### Permission Schema
```javascript
{
  name: String (unique, e.g., "user:create"),
  displayName: String (e.g., "Create User"),
  description: String,
  category: String (user, role, course, etc.),
  isActive: Boolean
}
```

### Role Schema
```javascript
{
  name: String (unique, e.g., "admin"),
  displayName: String (e.g., "Administrator"),
  description: String,
  level: Number (1-10, higher = more power),
  permissions: [ObjectId] (references Permission),
  isActive: Boolean,
  isSystem: Boolean (system roles can't be deleted)
}
```

### User Schema
```javascript
{
  name: String,
  email: String,
  password: String,
  roles: [ObjectId] (references Role),
  primaryRole: ObjectId (references Role),
  isActive: Boolean
}
```

## 🚀 Setup & Seeding

### 1. Seed Initial Data

Run this command to populate roles and permissions:

```bash
npm run seed
```

This creates:
- **25 permissions** across 7 categories
- **5 roles** (super-admin, admin, teacher, student, user)
- All relationships configured

### 2. Default Permissions

**User Category:**
- `user:create` - Create users
- `user:read` - View users
- `user:update` - Update users
- `user:delete` - Delete users

**Role Category:**
- `role:create` - Create roles
- `role:read` - View roles
- `role:update` - Update roles
- `role:delete` - Delete roles
- `role:assign` - Assign roles to users

**Permission Category:**
- `permission:create` - Create permissions
- `permission:read` - View permissions
- `permission:update` - Update permissions
- `permission:delete` - Delete permissions

**Course Category:**
- `course:create` - Create courses
- `course:read` - View courses
- `course:update` - Update courses
- `course:delete` - Delete courses
- `course:enroll` - Enroll in courses

**Student Category:**
- `student:read` - View students
- `student:update` - Update students
- `student:enroll` - Enroll students

**Newsletter Category:**
- `newsletter:read` - View newsletter
- `newsletter:delete` - Delete subscribers

**System Category:**
- `system:*` - All permissions (super-admin only)

### 3. Default Roles

| Role | Level | Permissions |
|------|-------|-------------|
| **super-admin** | 10 | `system:*` (all) |
| **admin** | 8 | User CRUD, Role read/assign, Newsletter |
| **teacher** | 5 | View users, Manage students, Manage courses |
| **student** | 3 | View users, View/enroll courses |
| **user** | 1 | View own profile |

## 💻 Usage Examples

### Check User Permissions

```javascript
// In controller
const user = await User.findById(userId).populate({
  path: 'roles',
  populate: { path: 'permissions' }
});

// Check if user has permission
if (await user.hasPermission('course:create')) {
  // User can create courses
}

// Get all user permissions
const permissions = await user.getAllPermissions();
// Returns: ['user:read', 'course:create', 'course:read', ...]
```

### Route Protection

```javascript
// Require specific role
router.get('/admin', protect, authorize('admin'), handler);

// Require permission
router.post('/courses', protect, can('course:create'), handler);

// Require multiple roles (OR logic)
router.get('/staff', protect, authorize('admin', 'teacher'), handler);

// Require all roles (AND logic)
router.get('/special', protect, authorizeAll('admin', 'teacher'), handler);
```

### Assign Role to User

```javascript
const { Role, User } = require('../models');

// Find role
const teacherRole = await Role.findOne({ name: 'teacher' });

// Assign to user
await user.addRole(teacherRole._id);
```

### Create Custom Role

```javascript
const { Role, Permission } = require('../models');

// Get permissions
const permissions = await Permission.find({
  name: { $in: ['course:read', 'course:enroll'] }
});

// Create role
const customRole = await Role.create({
  name: 'course-viewer',
  displayName: 'Course Viewer',
  description: 'Can only view and enroll in courses',
  level: 2,
  permissions: permissions.map(p => p._id)
});
```

### Add Permission to Role

```javascript
const { Role, Permission } = require('../models');

// Find role and permission
const role = await Role.findOne({ name: 'teacher' });
const permission = await Permission.findOne({ name: 'student:delete' });

// Add permission to role
await role.addPermission(permission._id);
```

## 🔒 API Endpoints

### Roles Management

```bash
# Get all roles
GET /api/v1/roles

# Get role by ID (with permissions)
GET /api/v1/roles/:roleId

# Create new role (Super Admin only)
POST /api/v1/roles
Body: {
  "name": "mentor",
  "displayName": "Mentor",
  "description": "Can mentor students",
  "level": 4,
  "permissions": ["permission_id_1", "permission_id_2"]
}

# Update role (Super Admin only)
PUT /api/v1/roles/:roleId

# Delete role (Super Admin only)
DELETE /api/v1/roles/:roleId

# Add permission to role (Super Admin only)
POST /api/v1/roles/:roleId/permissions
Body: {
  "permissionId": "permission_id_here"
}

# Remove permission from role (Super Admin only)
DELETE /api/v1/roles/:roleId/permissions/:permissionId
```

### Permissions Management

```bash
# Get all permissions
GET /api/v1/permissions

# Get permissions by category
GET /api/v1/permissions?category=course

# Create permission (Super Admin only)
POST /api/v1/permissions
Body: {
  "name": "exam:create",
  "displayName": "Create Exam",
  "description": "Can create exams",
  "category": "exam"
}

# Update permission (Super Admin only)
PUT /api/v1/permissions/:permissionId

# Delete permission (Super Admin only)
DELETE /api/v1/permissions/:permissionId
```

### User Role Assignment

```bash
# Assign role to user (Admin only)
POST /api/v1/roles/assign
Body: {
  "userId": "user_id_here",
  "roleId": "role_id_here"
}

# Remove role from user (Admin only)
DELETE /api/v1/roles/remove
Body: {
  "userId": "user_id_here",
  "roleId": "role_id_here"
}

# Get user's roles and permissions
GET /api/v1/roles/user/:userId
```

## 🎯 Benefits Over Hardcoded Roles

### Before (Hardcoded)
```javascript
// In constants.js
USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher'
}

// Problems:
// - Can't add roles without code changes
// - Can't modify permissions dynamically
// - Requires deployment to change roles
// - Not flexible for clients
```

### After (Database-Driven)
```javascript
// In database
// ✅ Add roles via API
// ✅ Modify permissions in real-time
// ✅ No deployment needed
// ✅ Client-specific customization
// ✅ Audit trail (timestamps)
// ✅ Soft delete (isActive flag)
```

## 🔧 Advanced Features

### 1. Custom Permissions Per Client

```javascript
// Create client-specific permission
await Permission.create({
  name: 'custom:feature',
  displayName: 'Custom Feature',
  description: 'Client-specific feature',
  category: 'custom'
});

// Assign to role
const role = await Role.findOne({ name: 'admin' });
const permission = await Permission.findOne({ name: 'custom:feature' });
await role.addPermission(permission._id);
```

### 2. Temporary Permissions

```javascript
// Add expiration field to role assignment
// (Can be implemented in future)
{
  roles: [
    {
      role: ObjectId,
      expiresAt: Date
    }
  ]
}
```

### 3. Permission Inheritance

```javascript
// Roles automatically inherit permissions
// e.g., admin gets all teacher permissions + more

const adminRole = await Role.findOne({ name: 'admin' }).populate('permissions');
const teacherRole = await Role.findOne({ name: 'teacher' }).populate('permissions');

// Combine permissions
const allPermissions = [
  ...adminRole.permissions,
  ...teacherRole.permissions
];
```

## 📊 Querying

### Get Users by Role

```javascript
const { User, Role } = require('../models');

const adminRole = await Role.findOne({ name: 'admin' });
const admins = await User.find({ roles: adminRole._id }).populate('roles');
```

### Get Users with Specific Permission

```javascript
const { User, Role, Permission } = require('../models');

const permission = await Permission.findOne({ name: 'course:create' });
const rolesWithPermission = await Role.find({ permissions: permission._id });
const roleIds = rolesWithPermission.map(r => r._id);

const usersWithPermission = await User.find({
  roles: { $in: roleIds }
}).populate('roles');
```

### Get Role Hierarchy

```javascript
const roles = await Role.find({ isActive: true })
  .populate('permissions')
  .sort({ level: -1 });

// Returns roles from highest to lowest level
```

## 🔄 Migration from String-Based Roles

If you have existing users with string roles:

```javascript
const { User, Role } = require('../models');

async function migrateRoles() {
  const users = await User.find({});
  
  for (const user of users) {
    // If user has old 'role' field (string)
    if (user.role) {
      const role = await Role.findOne({ name: user.role });
      if (role) {
        user.roles = [role._id];
        user.primaryRole = role._id;
        await user.save();
      }
    }
  }
}
```

## ⚠️ Important Notes

1. **Run seed before first use**: `npm run seed`
2. **System roles** (`isSystem: true`) cannot be deleted
3. **At least one role** required per user
4. **Super-admin only** can create/modify roles and permissions
5. **Soft delete**: Use `isActive: false` instead of deleting
6. **Populate roles** when checking permissions

## 🆘 Troubleshooting

**Issue**: "Cannot read property 'name' of undefined"
- **Solution**: Always populate roles: `user.populate('roles')`

**Issue**: Permission check always fails
- **Solution**: Populate both roles and permissions:
  ```javascript
  user.populate({
    path: 'roles',
    populate: { path: 'permissions' }
  })
  ```

**Issue**: Seeder fails
- **Solution**: Check MongoDB connection, ensure `MONGODB_URI` in `.env`

## 📈 Performance Tips

1. **Index fields**: Already indexed (name, level, isActive)
2. **Selective population**: Only populate when needed
3. **Cache roles**: Cache role data in Redis for faster lookups
4. **Batch operations**: Use `bulkWrite` for multiple updates

---

**This is a production-ready, scalable RBAC system!** 🚀







# Multi-Role System Guide

Complete guide for the multi-role system where users can have multiple roles simultaneously.

## 🎯 Overview

The system supports multiple roles per user with a hierarchical permission structure:
- **Super Admin** - Full system access
- **Admin** - Administrative access
- **Teacher** - Teaching and student management
- **Student** - Learning access
- **User** - Basic access

## 📊 Role Hierarchy

```
Level 5: Super Admin  (All permissions)
Level 4: Admin        (Administrative)
Level 3: Teacher      (Educational management)
Level 2: Student      (Learning access)
Level 1: User         (Basic access)
```

## 🔑 Role Permissions

### Super Admin (`super-admin`)
- **Permissions**: `['*']` (All permissions)
- Can manage all users, roles, and system settings
- Can assign/remove any role including super-admin

### Admin (`admin`)
- **Permissions**: 
  - `user:create`, `user:read`, `user:update`, `user:delete`
  - `newsletter:read`, `newsletter:delete`
  - `role:assign`
- Can manage users and assign roles (except super-admin)

### Teacher (`teacher`)
- **Permissions**:
  - `user:read`, `student:read`, `student:update`
  - `course:create`, `course:update`
- Can view and manage students
- Can create and manage courses

### Student (`student`)
- **Permissions**:
  - `user:read`, `course:read`, `course:enroll`
- Can view and enroll in courses
- Basic user operations

### User (`user`)
- **Permissions**: `user:read`
- Basic profile access
- Default role for all new users

## 🚀 API Endpoints

### Get All Available Roles
**GET** `/api/v1/roles`

Get list of all roles with their permissions.

**Response:**
```json
{
  "success": true,
  "message": "Roles retrieved successfully",
  "data": {
    "roles": [
      {
        "name": "super-admin",
        "level": 5,
        "permissions": ["*"]
      },
      {
        "name": "admin",
        "level": 4,
        "permissions": ["user:create", "user:read", ...]
      }
    ],
    "total": 5
  }
}
```

### Get User's Roles
**GET** `/api/v1/roles/user/:userId`

Get roles for a specific user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User roles retrieved successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "roles": ["teacher", "admin"],
      "primaryRole": "teacher",
      "highestRole": "admin"
    }
  }
}
```

### Assign Role to User
**POST** `/api/v1/roles/assign`

Assign a role to a user (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "teacher"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role 'teacher' assigned successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "roles": ["user", "teacher"],
      "primaryRole": "user"
    }
  }
}
```

### Remove Role from User
**DELETE** `/api/v1/roles/remove`

Remove a role from a user (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "teacher"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role 'teacher' removed successfully",
  "data": {
    "user": {
      "id": "...",
      "roles": ["user"],
      "primaryRole": "user"
    }
  }
}
```

### Set Primary Role
**PUT** `/api/v1/roles/primary`

Set the primary role for a user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "teacher"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Primary role set to 'teacher'",
  "data": {
    "user": {
      "roles": ["user", "teacher", "admin"],
      "primaryRole": "teacher"
    }
  }
}
```

### Get Users by Role
**GET** `/api/v1/roles/:role/users`

Get all users with a specific role (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `limit` (optional): Results per page (default: 50)
- `page` (optional): Page number (default: 1)

**Example:**
```
GET /api/v1/roles/teacher/users?limit=20&page=1
```

**Response:**
```json
{
  "success": true,
  "message": "Users with role 'teacher' retrieved successfully",
  "count": 20,
  "total": 45,
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "hasMore": true
  },
  "data": [...]
}
```

## 🔒 Authorization Middleware

### Single Role Check
```javascript
router.get('/admin-only', protect, authorize('admin'), handler);
```
User must have at least ONE of the specified roles.

### Multiple Role Check (OR logic)
```javascript
router.get('/staff', protect, authorize('admin', 'teacher'), handler);
```
User must have `admin` OR `teacher` role.

### All Roles Required (AND logic)
```javascript
router.get('/special', protect, authorizeAll('admin', 'teacher'), handler);
```
User must have BOTH `admin` AND `teacher` roles.

### Permission-Based Check
```javascript
router.post('/courses', protect, can('course:create'), handler);
```
User must have the specific permission (checks all their roles).

## 💻 Usage in Code

### Check if User Has Role
```javascript
if (user.hasRole('admin')) {
  // Do admin stuff
}
```

### Check if User Has Any Role
```javascript
if (user.hasAnyRole('admin', 'teacher')) {
  // User is staff
}
```

### Check if User Has All Roles
```javascript
if (user.hasAllRoles('admin', 'teacher')) {
  // User is both admin and teacher
}
```

### Get Highest Role
```javascript
const highestRole = user.getHighestRole();
// Returns: 'admin' if user has ['user', 'teacher', 'admin']
```

### Add Role
```javascript
await user.addRole('teacher');
```

### Remove Role
```javascript
await user.removeRole('teacher');
```

## 🎨 User Model Schema

```javascript
{
  roles: {
    type: [String],
    enum: ['super-admin', 'admin', 'teacher', 'student', 'user'],
    default: ['user']
  },
  primaryRole: {
    type: String,
    enum: ['super-admin', 'admin', 'teacher', 'student', 'user'],
    default: 'user'
  }
}
```

## 📝 Examples

### Example 1: Register User with Multiple Roles
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Teacher",
    "email": "john@school.com",
    "password": "password123"
  }'

# Default role: ['user']
```

### Example 2: Admin Assigns Teacher Role
```bash
# Login as admin first to get token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}'

# Assign teacher role
curl -X POST http://localhost:5000/api/v1/roles/assign \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "role": "teacher"
  }'
```

### Example 3: User Sets Primary Role
```bash
curl -X PUT http://localhost:5000/api/v1/roles/primary \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "role": "teacher"
  }'
```

### Example 4: Get All Teachers
```bash
curl -X GET "http://localhost:5000/api/v1/roles/teacher/users?limit=50" \
  -H "Authorization: Bearer <admin_token>"
```

## 🔐 Security Rules

1. **Super Admin Role**:
   - Only super-admin can assign super-admin role
   - Only super-admin can remove super-admin role

2. **Last Role Protection**:
   - Cannot remove a user's last role
   - User must always have at least one role

3. **Self-Management**:
   - Users can view their own roles
   - Users can set their own primary role (from roles they have)

4. **Admin Management**:
   - Admins can assign/remove roles (except super-admin)
   - Admins can view all users by role

## 🎯 Common Use Cases

### Use Case 1: Teacher who is also Admin
```javascript
roles: ['user', 'teacher', 'admin']
primaryRole: 'teacher'  // Shows as teacher in UI
```

### Use Case 2: Student Learning to Teach
```javascript
roles: ['user', 'student', 'teacher']
primaryRole: 'student'  // Primary identity
```

### Use Case 3: System Administrator
```javascript
roles: ['user', 'admin', 'super-admin']
primaryRole: 'super-admin'  // Full access
```

## ⚠️ Important Notes

- New users get `['user']` role by default
- Primary role is for display purposes (UI can show user as their primary role)
- Highest role is calculated for permission checks
- Roles are not hierarchical for permissions (explicit permission checks)
- Multiple roles allow flexible access control

## 📚 Migration from Single Role

If you have existing users with single `role` field:

```javascript
// Old structure
role: 'admin'

// New structure
roles: ['user', 'admin']
primaryRole: 'admin'
```

Create migration script if needed to convert existing users.

## 🆘 Troubleshooting

**Issue**: User can't access endpoint after role assignment
- **Solution**: User must login again to get new token with updated roles

**Issue**: Can't remove last role
- **Solution**: Assign a new role first, then remove the old one

**Issue**: Permission denied for super-admin operations
- **Solution**: Only users with super-admin role can manage super-admin

---

**Built for flexible, scalable role management!** 🎉







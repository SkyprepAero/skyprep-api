# 🚀 Quick Start Guide - SkyPrep API

Get up and running in 3 minutes!

## ✅ Prerequisites

- Node.js installed
- MongoDB Atlas connection string (already configured)
- Port 5000 available

## 🎯 Setup Steps

### Step 1: Install Dependencies ✓ (Already Done)
```bash
npm install
```

### Step 2: Seed Database ✓ (Already Done)
```bash
npm run seed
```

**✅ Created:**
- 24 permissions
- 5 roles (super-admin, admin, teacher, student, user)

### Step 3: Start Development Server
```bash
npm run dev
```

Server starts at: http://localhost:5000

## 🎉 Your API is Ready!

### Quick Test - API Info
```bash
curl http://localhost:5000/
```

### Quick Test - Health Check
```bash
curl http://localhost:5000/health
```

### Quick Test - Swagger Docs
Open in browser: http://localhost:5000/api-docs

## 📊 Available Endpoints

### 🔐 Authentication
- `POST /api/v1/auth/register` - Register user (gets 'user' role by default)
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user with roles & permissions

### 👥 Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get single user
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### 📧 Newsletter
- `POST /api/v1/newsletter/subscribe` - Subscribe to newsletter
- `POST /api/v1/newsletter/unsubscribe` - Unsubscribe
- `GET /api/v1/newsletter/stats` - Get stats (Admin only)
- `GET /api/v1/newsletter` - Get all subscribers (Admin only)

### 🎭 Roles
- `GET /api/v1/roles` - Get all roles
- `GET /api/v1/roles/user/:userId` - Get user's roles
- `POST /api/v1/roles/assign` - Assign role to user (Admin only)
- `DELETE /api/v1/roles/remove` - Remove role from user (Admin only)
- `PUT /api/v1/roles/primary` - Set primary role
- `GET /api/v1/roles/:role/users` - Get users by role (Admin only)

## 🧪 Test Flow

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "Test User",
      "email": "test@example.com",
      "roles": [
        {
          "id": "...",
          "name": "user",
          "displayName": "User"
        }
      ],
      "primaryRole": {
        "id": "...",
        "name": "user",
        "displayName": "User"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

**Save the token from response!**

### 3. Get Current User (with roles & permissions)
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response includes:**
- All roles
- All permissions
- isSuperAdmin flag
- Primary role

### 4. Subscribe to Newsletter
```bash
curl -X POST http://localhost:5000/api/v1/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newsletter@example.com",
    "name": "Newsletter User"
  }'
```

### 5. Get All Roles
```bash
curl -X GET http://localhost:5000/api/v1/roles
```

**Response shows all 5 roles with their permissions!**

## 🔑 Default Roles & Permissions

### Super Administrator (Level 10)
- **Permission**: `system:*` (all access)
- **Can do**: Everything, bypasses all checks
- **Use for**: System management

### Administrator (Level 8)
- **Permissions**: user:*, newsletter:*, role:read, role:assign
- **Can do**: Manage users, assign roles (except super-admin), manage newsletter
- **Use for**: Day-to-day administration

### Teacher (Level 5)
- **Permissions**: student:*, course:create, course:update, user:read
- **Can do**: Manage students, create/update courses
- **Use for**: Educational staff

### Student (Level 3)
- **Permissions**: course:read, course:enroll, user:read
- **Can do**: View and enroll in courses
- **Use for**: Learners

### User (Level 1)
- **Permissions**: user:read
- **Can do**: View own profile
- **Use for**: Default role for everyone

## 🎭 Role Assignment

### Make a User an Admin
```bash
# First, you need to create an admin user manually in DB
# Or assign admin role via MongoDB Compass

# Once you have an admin, they can assign roles:
curl -X POST http://localhost:5000/api/v1/roles/assign \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "roleId": "ADMIN_ROLE_ID_HERE"
  }'
```

### Create First Super Admin (Manual)

**Option 1: MongoDB Compass**
1. Open MongoDB Compass
2. Connect to your database
3. Find a user in `users` collection
4. Find super-admin role ID in `roles` collection
5. Add role ID to user's `roles` array
6. Set `primaryRole` to super-admin role ID

**Option 2: mongosh**
```javascript
// Connect to database
use skyprep-db

// Get super-admin role ID
const superAdminRole = db.roles.findOne({ name: 'super-admin' })

// Update user to be super admin
db.users.updateOne(
  { email: 'your@email.com' },
  { 
    $set: { 
      roles: [superAdminRole._id],
      primaryRole: superAdminRole._id
    }
  }
)
```

## 🎨 Swagger UI

Interactive API documentation with all endpoints:

**URL:** http://localhost:5000/api-docs

**Features:**
- Test all endpoints
- See request/response examples
- Try authentication
- View all schemas

## 📚 Documentation

- **README.md** - Main documentation
- **DEV_GUIDE.md** - Development guide
- **PROJECT_STRUCTURE.md** - Project overview
- **documents/DATABASE_RBAC_GUIDE.md** - RBAC system guide
- **documents/JWT_RBAC_GUIDE.md** - JWT & roles integration
- **documents/ROLES_GUIDE.md** - Role management guide
- **documents/NEWSLETTER_GUIDE.md** - Newsletter system guide

## 🔥 Pro Tips

1. **Always run `npm run dev`** for development (auto-restart)
2. **Use Swagger UI** for testing endpoints (easier than cURL)
3. **Check terminal logs** for errors and super admin actions
4. **Super admin bypasses all checks** - perfect for testing
5. **JWT includes roles & permissions** - check token payload

## ⚡ Common Commands

```bash
# Start development server
npm run dev

# Seed database (creates roles & permissions)
npm run seed

# Production server
npm start

# Kill port 5000 (if blocked)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

## 🎯 Next Steps

1. Create your first super admin (see above)
2. Test authentication endpoints
3. Assign roles to users
4. Build your frontend
5. Add more features (courses, assignments, etc.)

## 🆘 Troubleshooting

**Issue**: Can't register user - "Default role not found"
- **Solution**: Run `npm run seed` first

**Issue**: Token doesn't include roles
- **Solution**: Login again after running seeder

**Issue**: Port 5000 in use
- **Solution**: Kill process or change PORT in .env

**Issue**: MongoDB connection error
- **Solution**: Check MONGODB_URI in .env file

---

**You're all set! Start building! 🚀**

Visit: http://localhost:5000/api-docs









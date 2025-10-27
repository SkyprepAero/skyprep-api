require('dotenv').config();
const mongoose = require('mongoose');
const { Role, Permission } = require('../models');

// Define all permissions
const permissions = [
  // User permissions
  { name: 'user:create', displayName: 'Create User', description: 'Can create new users', category: 'user' },
  { name: 'user:read', displayName: 'Read User', description: 'Can view user information', category: 'user' },
  { name: 'user:update', displayName: 'Update User', description: 'Can update user information', category: 'user' },
  { name: 'user:delete', displayName: 'Delete User', description: 'Can delete users', category: 'user' },
  
  // Role permissions
  { name: 'role:create', displayName: 'Create Role', description: 'Can create new roles', category: 'role' },
  { name: 'role:read', displayName: 'Read Role', description: 'Can view roles', category: 'role' },
  { name: 'role:update', displayName: 'Update Role', description: 'Can update roles', category: 'role' },
  { name: 'role:delete', displayName: 'Delete Role', description: 'Can delete roles', category: 'role' },
  { name: 'role:assign', displayName: 'Assign Role', description: 'Can assign roles to users', category: 'role' },
  
  // Permission permissions
  { name: 'permission:create', displayName: 'Create Permission', description: 'Can create permissions', category: 'permission' },
  { name: 'permission:read', displayName: 'Read Permission', description: 'Can view permissions', category: 'permission' },
  { name: 'permission:update', displayName: 'Update Permission', description: 'Can update permissions', category: 'permission' },
  { name: 'permission:delete', displayName: 'Delete Permission', description: 'Can delete permissions', category: 'permission' },
  
  // Student permissions
  { name: 'student:read', displayName: 'Read Student', description: 'Can view student information', category: 'student' },
  { name: 'student:update', displayName: 'Update Student', description: 'Can update student information', category: 'student' },
  { name: 'student:enroll', displayName: 'Enroll Student', description: 'Can enroll students in courses', category: 'student' },
  
  // Course permissions
  { name: 'course:create', displayName: 'Create Course', description: 'Can create courses', category: 'course' },
  { name: 'course:read', displayName: 'Read Course', description: 'Can view courses', category: 'course' },
  { name: 'course:update', displayName: 'Update Course', description: 'Can update courses', category: 'course' },
  { name: 'course:delete', displayName: 'Delete Course', description: 'Can delete courses', category: 'course' },
  { name: 'course:enroll', displayName: 'Enroll in Course', description: 'Can enroll in courses', category: 'course' },
  
  // Newsletter permissions
  { name: 'newsletter:read', displayName: 'Read Newsletter', description: 'Can view newsletter subscribers', category: 'newsletter' },
  { name: 'newsletter:delete', displayName: 'Delete Newsletter', description: 'Can delete newsletter subscribers', category: 'newsletter' },
  
  // System permissions
  { name: 'system:*', displayName: 'All Permissions', description: 'Full system access', category: 'system' }
];

// Define roles with their permissions
const roles = [
  {
    name: 'super-admin',
    displayName: 'Super Administrator',
    description: 'Full system access with all permissions',
    level: 10,
    isSystem: true,
    permissions: ['system:*']
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Administrative access to manage users and system',
    level: 8,
    isSystem: true,
    permissions: [
      'user:create', 'user:read', 'user:update', 'user:delete',
      'role:read', 'role:assign',
      'newsletter:read', 'newsletter:delete'
    ]
  },
  {
    name: 'teacher',
    displayName: 'Teacher',
    description: 'Can manage courses and students',
    level: 5,
    isSystem: true,
    permissions: [
      'user:read',
      'student:read', 'student:update', 'student:enroll',
      'course:create', 'course:read', 'course:update'
    ]
  },
  {
    name: 'student',
    displayName: 'Student',
    description: 'Can view and enroll in courses',
    level: 3,
    isSystem: true,
    permissions: [
      'user:read',
      'course:read', 'course:enroll'
    ]
  },
  {
    name: 'user',
    displayName: 'User',
    description: 'Basic user access',
    level: 1,
    isSystem: true,
    permissions: ['user:read']
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (optional - remove in production)
    console.log('Clearing existing roles and permissions...');
    await Permission.deleteMany({});
    await Role.deleteMany({});

    // Create permissions
    console.log('Creating permissions...');
    const createdPermissions = await Permission.insertMany(permissions);
    console.log(`✓ Created ${createdPermissions.length} permissions`);

    // Create a map of permission names to IDs
    const permissionMap = {};
    createdPermissions.forEach(p => {
      permissionMap[p.name] = p._id;
    });

    // Create roles with permission references
    console.log('Creating roles...');
    for (const roleData of roles) {
      const permissionIds = roleData.permissions.map(permName => permissionMap[permName]);
      
      const role = await Role.create({
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        level: roleData.level,
        isSystem: roleData.isSystem,
        permissions: permissionIds
      });
      
      console.log(`✓ Created role: ${role.displayName} (${role.name}) with ${permissionIds.length} permissions`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nRoles created:');
    const allRoles = await Role.find().populate('permissions');
    allRoles.forEach(role => {
      console.log(`  - ${role.displayName} (${role.name}): Level ${role.level}, ${role.permissions.length} permissions`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();






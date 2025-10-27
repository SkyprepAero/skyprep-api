const express = require('express');
const router = express.Router();
const {
  getAllRoles,
  getUserRoles,
  assignRole,
  removeRole,
  setPrimaryRole,
  getUsersByRole
} = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { validateRequest } = require('../middleware/validateRequest');

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: Get all available roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: List of all roles
 */
router.get('/', getAllRoles);

/**
 * @swagger
 * /api/v1/roles/user/{userId}:
 *   get:
 *     summary: Get user's roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User roles retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', protect, getUserRoles);

/**
 * @swagger
 * /api/v1/roles/assign:
 *   post:
 *     summary: Assign role to user (Admin only)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               role:
 *                 type: string
 *                 enum: [super-admin, admin, teacher, student, user]
 *                 example: teacher
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/assign',
  protect,
  authorize('admin', 'super-admin'),
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('role')
      .notEmpty()
      .withMessage('Role is required')
      .isIn(['super-admin', 'admin', 'teacher', 'student', 'user'])
      .withMessage('Invalid role')
  ],
  validateRequest,
  assignRole
);

/**
 * @swagger
 * /api/v1/roles/remove:
 *   delete:
 *     summary: Remove role from user (Admin only)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role removed successfully
 */
router.delete(
  '/remove',
  protect,
  authorize('admin', 'super-admin'),
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('role').notEmpty().withMessage('Role is required')
  ],
  validateRequest,
  removeRole
);

/**
 * @swagger
 * /api/v1/roles/primary:
 *   put:
 *     summary: Set primary role for user
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Primary role set successfully
 */
router.put(
  '/primary',
  protect,
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('role').notEmpty().withMessage('Role is required')
  ],
  validateRequest,
  setPrimaryRole
);

/**
 * @swagger
 * /api/v1/roles/{role}/users:
 *   get:
 *     summary: Get all users with specific role (Admin only)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/:role/users', protect, authorize('admin', 'super-admin'), getUsersByRole);

module.exports = router;


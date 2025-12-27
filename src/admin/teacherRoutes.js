const express = require('express');
const router = express.Router();
const { registerTeacherByAdmin } = require('./teacherController');
const { registerTeacherValidation } = require('./teacherValidation');
const { validateRequest } = require('../middleware/validateRequest');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/admin/teachers/register:
 *   post:
 *     summary: Register a new teacher (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: teacher@example.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               city:
 *                 type: string
 *                 example: "New York"
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Teacher registered successfully
 *       400:
 *         description: Validation error or user already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  '/register',
  protect,
  authorize('admin', 'super-admin'),
  registerTeacherValidation,
  validateRequest,
  registerTeacherByAdmin
);

module.exports = router;




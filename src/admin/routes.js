const express = require('express');
const router = express.Router();
const { registerAdmin } = require('./controller');
const { registerAdminValidation } = require('./validation');
const { validateRequest } = require('../middleware/validateRequest');

/**
 * @swagger
 * /api/v1/auth/admin/register:
 *   post:
 *     summary: Register a new admin user
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Admin User
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: SecurePass123
 *               phoneNumber:
 *                 type: string
 *                 example: +1234567890
 *               city:
 *                 type: string
 *                 example: New York
 *     responses:
 *       201:
 *         description: Admin user registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *                     tokenExpiresAt:
 *                       type: string
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/register', registerAdminValidation, validateRequest, registerAdmin);

module.exports = router;


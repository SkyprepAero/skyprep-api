const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getMyEnrollment,
  googleLogin,
  verifyLoginPasscode,
  requestPasswordResetPasscode,
  verifyPasswordResetPasscode,
  resetPasswordWithToken,
  setupPasswordWithToken
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  loginPasscodeValidation,
  googleLoginValidation,
  forgotPasswordRequestValidation,
  forgotPasswordVerifyValidation,
  forgotPasswordResetValidation,
  setupPasswordValidation
} = require('../validations/authValidation');
const { validateRequest } = require('../middleware/validateRequest');
const adminRoutes = require('../admin/routes');
const { registerTeacherPublic } = require('../admin/teacherController');
const { registerTeacherValidation } = require('../admin/teacherValidation');

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', registerValidation, validateRequest, register);

/**
 * @swagger
 * /api/v1/auth/teachers/register:
 *   post:
 *     summary: Register a new teacher (Public endpoint for self-registration)
 *     tags: [Authentication]
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
 *     responses:
 *       201:
 *         description: Teacher registration request received. Password setup email has been sent.
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/teachers/register', registerTeacherValidation, validateRequest, registerTeacherPublic);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', loginValidation, validateRequest, login);

/**
 * @swagger
 * /api/v1/auth/login/passcode:
 *   post:
 *     summary: Verify login passcode
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginPasscodeRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Passcode not found or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid passcode or too many attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login/passcode', loginPasscodeValidation, validateRequest, verifyLoginPasscode);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request passcode to reset password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Passcode sent if email exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/forgot-password',
  forgotPasswordRequestValidation,
  validateRequest,
  requestPasswordResetPasscode
);

/**
 * @swagger
 * /api/v1/auth/forgot-password/verify:
 *   post:
 *     summary: Verify password reset passcode
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordVerify'
 *     responses:
 *       200:
 *         description: Passcode verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post(
  '/forgot-password/verify',
  forgotPasswordVerifyValidation,
  validateRequest,
  verifyPasswordResetPasscode
);

/**
 * @swagger
 * /api/v1/auth/forgot-password/reset:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordReset'
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post(
  '/forgot-password/reset',
  forgotPasswordResetValidation,
  validateRequest,
  resetPasswordWithToken
);

/**
 * @swagger
 * /api/v1/auth/setup-password:
 *   post:
 *     summary: Setup password using setup token (for new enrollments)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - setupToken
 *               - newPassword
 *             properties:
 *               setupToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Password setup successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid or expired token
 */
router.post(
  '/setup-password',
  setupPasswordValidation,
  validateRequest,
  setupPasswordWithToken
);

/**
 * @swagger
 * /api/v1/auth/google:
 *   post:
 *     summary: Login or register with Google
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleLoginRequest'
 *     responses:
 *       200:
 *         description: Google authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Google authentication failed or email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/google', googleLoginValidation, validateRequest, googleLogin);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/v1/auth/me/enrollment:
 *   get:
 *     summary: Get current user's enrollment details (Focus One or Cohort)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollment retrieved successfully
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
 *                   nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me/enrollment', protect, getMyEnrollment);


// Admin routes
router.use('/admin', adminRoutes);

module.exports = router;

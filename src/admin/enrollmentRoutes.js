const express = require('express');
const router = express.Router();
const {
  enrollStudent,
  getAllEnrollments,
  getFocusOneEnrollments,
  getEnrollmentById,
  updateEnrollment,
  cancelEnrollment
} = require('./enrollmentController');
const { enrollStudentValidation } = require('./enrollmentValidation');
const { validateRequest } = require('../middleware/validateRequest');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/admin/focus-one/enroll:
 *   post:
 *     summary: Enroll a student in Focus One
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
 *               - subjectIds
 *               - teacherIds
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               subjectIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *                 example: ["507f1f77bcf86cd799439011"]
 *               teacherIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *                 example: ["507f1f77bcf86cd799439012"]
 *               startedAt:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *     responses:
 *       201:
 *         description: Student enrolled successfully
 *       400:
 *         description: Validation error or enrollment conflict
 */
router.post(
  '/focus-one/enroll',
  protect,
  authorize('admin', 'super-admin'),
  enrollStudentValidation,
  validateRequest,
  enrollStudent
);

/**
 * @swagger
 * /api/v1/admin/focus-one/enrollments:
 *   get:
 *     summary: Get all Focus One enrollments
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/focus-one/enrollments', protect, authorize('admin', 'super-admin'), getAllEnrollments);

/**
 * @swagger
 * /api/v1/admin/focus-one/:focusOneId/enrollments:
 *   get:
 *     summary: Get enrollments for a specific Focus One
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/focus-one/:focusOneId/enrollments', protect, authorize('admin', 'super-admin'), getFocusOneEnrollments);

/**
 * @swagger
 * /api/v1/admin/focus-one/enrollments/:userId:
 *   get:
 *     summary: Get a specific enrollment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/focus-one/enrollments/:userId', protect, authorize('admin', 'super-admin'), getEnrollmentById);

/**
 * @swagger
 * /api/v1/admin/focus-one/enrollments/:userId:
 *   put:
 *     summary: Update an enrollment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put('/focus-one/enrollments/:userId', protect, authorize('admin', 'super-admin'), updateEnrollment);

/**
 * @swagger
 * /api/v1/admin/focus-one/enrollments/:userId:
 *   delete:
 *     summary: Cancel an enrollment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/focus-one/enrollments/:userId', protect, authorize('admin', 'super-admin'), cancelEnrollment);

module.exports = router;


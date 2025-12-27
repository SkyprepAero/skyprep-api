const express = require('express');
const router = express.Router();
const testSeriesController = require('../controllers/testSeriesController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/test-series:
 *   post:
 *     summary: Create a new Test Series
 *     tags: [Test Series]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               subjects:
 *                 type: array
 *               settings:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       201:
 *         description: Test Series created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', protect, authorize('admin'), testSeriesController.createTestSeries);

/**
 * @swagger
 * /api/v1/test-series:
 *   get:
 *     summary: Get all Test Series
 *     tags: [Test Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Test Series retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', protect, authorize('admin'), testSeriesController.getAllTestSeries);

/**
 * @swagger
 * /api/v1/test-series/deleted:
 *   get:
 *     summary: Get all deleted Test Series
 *     tags: [Test Series]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted Test Series retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/deleted', protect, authorize('admin'), testSeriesController.getDeletedTestSeries);

// User Test Series Enrollment Routes
const userTestSeriesController = require('../controllers/userTestSeriesController');

/**
 * @swagger
 * /api/v1/test-series/enroll:
 *   post:
 *     summary: Enroll user in a test series
 *     tags: [Test Series]
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
 *               - testSeriesId
 *             properties:
 *               userId:
 *                 type: string
 *               testSeriesId:
 *                 type: string
 *               subjects:
 *                 type: array
 *               billing:
 *                 type: object
 *     responses:
 *       201:
 *         description: User enrolled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/enroll', protect, authorize('admin'), userTestSeriesController.enrollUser);

/**
 * @swagger
 * /api/v1/test-series/users/{userId}/enrollments:
 *   get:
 *     summary: Get all test series enrollments for a user
 *     tags: [Test Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
 */
router.get('/users/:userId/enrollments', protect, authorize('admin'), userTestSeriesController.getUserEnrollments);

/**
 * @swagger
 * /api/v1/test-series/{testSeriesId}/enrollments:
 *   get:
 *     summary: Get all enrollments for a test series
 *     tags: [Test Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testSeriesId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
 */
router.get('/:testSeriesId/enrollments', protect, authorize('admin'), userTestSeriesController.getTestSeriesEnrollments);

/**
 * @swagger
 * /api/v1/test-series/enrollments/{id}:
 *   put:
 *     summary: Update test series enrollment
 *     tags: [Test Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment updated successfully
 */
router.put('/enrollments/:id', protect, authorize('admin'), userTestSeriesController.updateEnrollment);

/**
 * @swagger
 * /api/v1/test-series/enrollments/{id}:
 *   delete:
 *     summary: Cancel test series enrollment
 *     tags: [Test Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment cancelled successfully
 */
router.delete('/enrollments/:id', protect, authorize('admin'), userTestSeriesController.cancelEnrollment);

/**
 * @swagger
 * /api/v1/test-series/{id}:
 *   get:
 *     summary: Get Test Series by ID
 *     tags: [Test Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test Series retrieved successfully
 *       404:
 *         description: Test Series not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/:id', protect, authorize('admin'), testSeriesController.getTestSeriesById);

/**
 * @swagger
 * /api/v1/test-series/{id}:
 *   put:
 *     summary: Update Test Series
 *     tags: [Test Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Test Series updated successfully
 *       404:
 *         description: Test Series not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id', protect, authorize('admin'), testSeriesController.updateTestSeries);

/**
 * @swagger
 * /api/v1/test-series/{id}:
 *   delete:
 *     summary: Delete Test Series (soft delete)
 *     tags: [Test Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test Series deleted successfully
 *       404:
 *         description: Test Series not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/:id', protect, authorize('admin'), testSeriesController.deleteTestSeries);

/**
 * @swagger
 * /api/v1/test-series/{id}/restore:
 *   patch:
 *     summary: Restore soft deleted Test Series
 *     tags: [Test Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test Series restored successfully
 *       404:
 *         description: Test Series not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.patch('/:id/restore', protect, authorize('admin'), testSeriesController.restoreTestSeries);

module.exports = router;


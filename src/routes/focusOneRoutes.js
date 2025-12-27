const express = require('express');
const router = express.Router();
const focusOneController = require('../controllers/focusOneController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/focus-ones:
 *   post:
 *     summary: Create a new Focus One
 *     tags: [Focus Ones]
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
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               subjects:
 *                 type: array
 *               enrollmentConfig:
 *                 type: object
 *     responses:
 *       201:
 *         description: Focus One created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', protect, authorize('admin'), focusOneController.createFocusOne);

/**
 * @swagger
 * /api/v1/focus-ones:
 *   get:
 *     summary: Get all Focus Ones
 *     tags: [Focus Ones]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Focus Ones retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', protect, authorize('admin'), focusOneController.getAllFocusOnes);

/**
 * @swagger
 * /api/v1/focus-ones/deleted:
 *   get:
 *     summary: Get all deleted Focus Ones
 *     tags: [Focus Ones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted Focus Ones retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/deleted', protect, authorize('admin'), focusOneController.getDeletedFocusOnes);

/**
 * @swagger
 * /api/v1/focus-ones/{id}:
 *   get:
 *     summary: Get Focus One by ID
 *     tags: [Focus Ones]
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
 *         description: Focus One retrieved successfully
 *       404:
 *         description: Focus One not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/:id', protect, authorize('admin'), focusOneController.getFocusOneById);

/**
 * @swagger
 * /api/v1/focus-ones/{id}:
 *   put:
 *     summary: Update Focus One
 *     tags: [Focus Ones]
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
 *         description: Focus One updated successfully
 *       404:
 *         description: Focus One not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id', protect, authorize('admin'), focusOneController.updateFocusOne);

/**
 * @swagger
 * /api/v1/focus-ones/{id}:
 *   delete:
 *     summary: Delete Focus One (soft delete)
 *     tags: [Focus Ones]
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
 *         description: Focus One deleted successfully
 *       404:
 *         description: Focus One not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/:id', protect, authorize('admin'), focusOneController.deleteFocusOne);

/**
 * @swagger
 * /api/v1/focus-ones/{id}/restore:
 *   patch:
 *     summary: Restore soft deleted Focus One
 *     tags: [Focus Ones]
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
 *         description: Focus One restored successfully
 *       404:
 *         description: Focus One not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.patch('/:id/restore', protect, authorize('admin'), focusOneController.restoreFocusOne);

router.post('/:id/pause', protect, authorize('admin', 'super-admin'), focusOneController.pauseFocusOne);

router.post('/:id/resume', protect, authorize('admin', 'super-admin'), focusOneController.resumeFocusOne);

/**
 * @swagger
 * /api/v1/focus-ones/teacher/mine:
 *   get:
 *     summary: Get Focus Ones for teacher
 *     tags: [Focus Ones]
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
 *     responses:
 *       200:
 *         description: Focus Ones retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/teacher/mine', protect, focusOneController.getTeacherFocusOnes);
router.get('/teacher/mine/:id', protect, focusOneController.getTeacherFocusOneById);

module.exports = router;


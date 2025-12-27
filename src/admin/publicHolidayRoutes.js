const express = require('express');
const router = express.Router();
const {
  createPublicHoliday,
  getAllPublicHolidays,
  getPublicHolidayById,
  updatePublicHoliday,
  deletePublicHoliday
} = require('./publicHolidayController');
const { createPublicHolidayValidation, updatePublicHolidayValidation } = require('./publicHolidayValidation');
const { validateRequest } = require('../middleware/validateRequest');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/admin/public-holidays:
 *   post:
 *     summary: Create a new public holiday
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
 *               - name
 *               - date
 *             properties:
 *               name:
 *                 type: string
 *                 example: Independence Day
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-08-15"
 *               description:
 *                 type: string
 *                 example: "Indian Independence Day"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Public holiday created successfully
 *       400:
 *         description: Validation error or duplicate date
 */
router.post(
  '/public-holidays',
  protect,
  authorize('admin', 'super-admin'),
  createPublicHolidayValidation,
  validateRequest,
  createPublicHoliday
);

/**
 * @swagger
 * /api/v1/admin/public-holidays:
 *   get:
 *     summary: Get all public holidays
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Public holidays retrieved successfully
 */
router.get('/public-holidays', protect, authorize('admin', 'super-admin'), getAllPublicHolidays);

/**
 * @swagger
 * /api/v1/admin/public-holidays/:id:
 *   get:
 *     summary: Get a public holiday by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Public holiday retrieved successfully
 *       404:
 *         description: Public holiday not found
 */
router.get('/public-holidays/:id', protect, authorize('admin', 'super-admin'), getPublicHolidayById);

/**
 * @swagger
 * /api/v1/admin/public-holidays/:id:
 *   put:
 *     summary: Update a public holiday
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Public holiday updated successfully
 *       404:
 *         description: Public holiday not found
 */
router.put(
  '/public-holidays/:id',
  protect,
  authorize('admin', 'super-admin'),
  updatePublicHolidayValidation,
  validateRequest,
  updatePublicHoliday
);

/**
 * @swagger
 * /api/v1/admin/public-holidays/:id:
 *   delete:
 *     summary: Delete a public holiday
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Public holiday deleted successfully
 *       404:
 *         description: Public holiday not found
 */
router.delete('/public-holidays/:id', protect, authorize('admin', 'super-admin'), deletePublicHoliday);

module.exports = router;


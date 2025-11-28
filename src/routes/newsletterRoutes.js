const express = require('express');
const router = express.Router();
const {
  subscribe,
  unsubscribe,
  getSubscriber,
  getAllSubscribers,
  getStats,
  deleteSubscriber
} = require('../controllers/newsletterController');
const { protect, authorize } = require('../middleware/auth');
const {
  subscribeValidation,
  unsubscribeValidation,
  emailParamValidation
} = require('../validations/newsletterValidation');
const { validateRequest } = require('../middleware/validateRequest');

/**
 * @swagger
 * /api/v1/newsletter/subscribe:
 *   post:
 *     summary: Subscribe to newsletter (Pre-launch)
 *     tags: [Newsletter]
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
 *                 example: user@example.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["product-updates", "news"]
 *               topic:
 *                 type: string
 *                 example: "FocusONE"
 *               source:
 *                 type: string
 *                 example: website
 *     responses:
 *       201:
 *         description: Successfully subscribed
 *       200:
 *         description: Already subscribed or resubscribed
 *       400:
 *         description: Validation error
 */
router.post('/subscribe', subscribeValidation, validateRequest, subscribe);

/**
 * @swagger
 * /api/v1/newsletter/unsubscribe:
 *   post:
 *     summary: Unsubscribe from newsletter
 *     tags: [Newsletter]
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
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Successfully unsubscribed
 *       404:
 *         description: Email not found
 */
router.post('/unsubscribe', unsubscribeValidation, validateRequest, unsubscribe);

/**
 * @swagger
 * /api/v1/newsletter/stats:
 *   get:
 *     summary: Get newsletter statistics (Admin only)
 *     tags: [Newsletter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/stats', protect, authorize('admin'), getStats);

/**
 * @swagger
 * /api/v1/newsletter:
 *   get:
 *     summary: Get all subscribers (Admin only)
 *     tags: [Newsletter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [subscribed, unsubscribed]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Subscribers list retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, authorize('admin'), getAllSubscribers);

/**
 * @swagger
 * /api/v1/newsletter/{email}:
 *   get:
 *     summary: Get subscriber by email
 *     tags: [Newsletter]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscriber found
 *       404:
 *         description: Subscriber not found
 *   delete:
 *     summary: Delete subscriber (Admin only)
 *     tags: [Newsletter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscriber deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subscriber not found
 */
router.route('/:email')
  .get(emailParamValidation, validateRequest, getSubscriber)
  .delete(protect, authorize('admin'), emailParamValidation, validateRequest, deleteSubscriber);

module.exports = router;






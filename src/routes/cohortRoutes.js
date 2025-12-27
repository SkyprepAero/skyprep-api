const express = require('express');
const router = express.Router();
const cohortController = require('../controllers/cohortController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/cohorts/teacher/mine:
 *   get:
 *     summary: Get Cohorts for teacher
 *     tags: [Cohorts]
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
 *         description: Cohorts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/teacher/mine', protect, cohortController.getTeacherCohorts);
router.get('/teacher/mine/:id', protect, cohortController.getTeacherCohortById);

module.exports = router;


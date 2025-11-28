const express = require('express');
const router = express.Router();

const { createLead } = require('../controllers/leadController');
const { leadSubmissionValidation } = require('../validations/leadValidation');
const { validateRequest } = require('../middleware/validateRequest');

/**
 * @swagger
 * /api/v1/leads:
 *   post:
 *     summary: Submit a lead from contact or enquiry forms
 *     tags: [Leads]
 *     security: []  # Public endpoint - no authentication required
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeadSubmission'
 *     responses:
 *       200:
 *         description: Lead submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Public route - no authentication required for form submissions
router.post('/', leadSubmissionValidation, validateRequest, createLead);

module.exports = router;



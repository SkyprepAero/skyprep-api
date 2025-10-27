const express = require('express');
const router = express.Router();
const optionController = require('../controllers/optionController');
const { validateRequestWithJoi } = require('../middleware/validateRequest');
const Joi = require('joi');

// Option validation schemas
const createOptionsSchema = Joi.object({
  options: Joi.array()
    .items(Joi.object({
      text: Joi.string().trim().min(1).max(500).required(),
      isCorrect: Joi.boolean().required()
    }))
    .min(2)
    .max(4)
    .required()
    .custom((value, helpers) => {
      const correctOptions = value.filter(option => option.isCorrect);
      if (correctOptions.length === 0) {
        return helpers.error('custom.atLeastOneCorrect');
      }
      return value;
    })
    .messages({
      'custom.atLeastOneCorrect': 'At least one option must be marked as correct'
    })
});

const updateOptionSchema = Joi.object({
  text: Joi.string().trim().min(1).max(500).optional(),
  isCorrect: Joi.boolean().optional(),
  order: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional()
});

const reorderOptionsSchema = Joi.object({
  optionOrders: Joi.array()
    .items(Joi.object({
      optionId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
      order: Joi.number().integer().min(0).required()
    }))
    .min(2)
    .required()
});

const getOptionsByQuestionSchema = Joi.object({
  questionId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid question ID format',
      'any.required': 'Question ID is required'
    })
});

const getOptionByIdSchema = Joi.object({
  optionId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid option ID format',
      'any.required': 'Option ID is required'
    })
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Option:
 *       type: object
 *       required:
 *         - text
 *         - isCorrect
 *         - question
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the option
 *         text:
 *           type: string
 *           description: The text of the option
 *         isCorrect:
 *           type: boolean
 *           description: Whether this option is correct
 *         question:
 *           type: string
 *           description: ID of the question this option belongs to
 *         order:
 *           type: integer
 *           description: Order of the option within the question
 *         isActive:
 *           type: boolean
 *           description: Whether the option is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/options/question/{questionId}:
 *   post:
 *     summary: Create options for a question
 *     tags: [Options]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - options
 *             properties:
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - text
 *                     - isCorrect
 *                   properties:
 *                     text:
 *                       type: string
 *                       description: The text of the option
 *                     isCorrect:
 *                       type: boolean
 *                       description: Whether this option is correct
 *                 minItems: 2
 *                 maxItems: 4
 *     responses:
 *       201:
 *         description: Options created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.post('/question/:questionId', validateRequestWithJoi(createOptionsSchema), optionController.createOptions);

/**
 * @swagger
 * /api/options/question/{questionId}:
 *   get:
 *     summary: Get options for a question
 *     tags: [Options]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Options retrieved successfully
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.get('/question/:questionId', validateRequestWithJoi(getOptionsByQuestionSchema), optionController.getOptionsByQuestion);

/**
 * @swagger
 * /api/options/{optionId}:
 *   put:
 *     summary: Update an option
 *     tags: [Options]
 *     parameters:
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Option ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text of the option
 *               isCorrect:
 *                 type: boolean
 *                 description: Whether this option is correct
 *               order:
 *                 type: integer
 *                 minimum: 0
 *                 description: Order of the option
 *               isActive:
 *                 type: boolean
 *                 description: Whether the option is active
 *     responses:
 *       200:
 *         description: Option updated successfully
 *       404:
 *         description: Option not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.put('/:optionId', validateRequestWithJoi(updateOptionSchema), optionController.updateOption);

/**
 * @swagger
 * /api/options/{optionId}:
 *   delete:
 *     summary: Delete an option
 *     tags: [Options]
 *     parameters:
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Option ID
 *     responses:
 *       200:
 *         description: Option deleted successfully
 *       404:
 *         description: Option not found
 *       400:
 *         description: Cannot delete the only correct option
 *       500:
 *         description: Internal server error
 */
router.delete('/:optionId', validateRequestWithJoi(getOptionByIdSchema), optionController.deleteOption);

/**
 * @swagger
 * /api/options/question/{questionId}/reorder:
 *   put:
 *     summary: Reorder options for a question
 *     tags: [Options]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - optionOrders
 *             properties:
 *               optionOrders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - optionId
 *                     - order
 *                   properties:
 *                     optionId:
 *                       type: string
 *                       description: ID of the option
 *                     order:
 *                       type: integer
 *                       minimum: 0
 *                       description: New order of the option
 *     responses:
 *       200:
 *         description: Options reordered successfully
 *       404:
 *         description: Question not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.put('/question/:questionId/reorder', validateRequestWithJoi(reorderOptionsSchema), optionController.reorderOptions);

module.exports = router;

const express = require('express');
const router = express.Router();
const optionController = require('../controllers/optionController');

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
 *           description: The option text
 *         isCorrect:
 *           type: boolean
 *           description: Whether this option is correct
 *         question:
 *           type: string
 *           description: The question ID this option belongs to
 *         order:
 *           type: number
 *           description: Display order of the option
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
 *                     isCorrect:
 *                       type: boolean
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
router.post('/question/:questionId', optionController.createOptions);

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
 *     responses:
 *       200:
 *         description: Options retrieved successfully
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.get('/question/:questionId', optionController.getOptionsByQuestion);

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               isCorrect:
 *                 type: boolean
 *               order:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Option updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Option not found
 *       500:
 *         description: Internal server error
 */
router.put('/:optionId', optionController.updateOption);

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
 *     responses:
 *       200:
 *         description: Option deleted successfully
 *       400:
 *         description: Cannot delete the only correct option
 *       404:
 *         description: Option not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:optionId', optionController.deleteOption);

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
 *                     order:
 *                       type: number
 *     responses:
 *       200:
 *         description: Options reordered successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.put('/question/:questionId/reorder', optionController.reorderOptions);

module.exports = router;
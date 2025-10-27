const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { validateRequestWithJoi } = require('../middleware/validateRequest');
const {
  createQuestionSchema,
  updateQuestionSchema,
  getQuestionsSchema,
  getQuestionByIdSchema,
  getQuestionsByChapterSchema,
  getQuestionsBySubjectSchema,
  getQuestionStatsSchema
} = require('../validations/questionValidation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Option:
 *       type: object
 *       required:
 *         - text
 *         - isCorrect
 *       properties:
 *         text:
 *           type: string
 *           description: The text of the option
 *         isCorrect:
 *           type: boolean
 *           description: Whether this option is correct
 *     
 *     Question:
 *       type: object
 *       required:
 *         - questionText
 *         - options
 *         - chapter
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the question
 *         questionText:
 *           type: string
 *           description: The text of the question
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Option'
 *           minItems: 2
 *           maxItems: 4
 *           description: Array of options for the question
 *         correctOptions:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of indices of correct options
 *         explanation:
 *           type: string
 *           description: Explanation for the question
 *         chapter:
 *           type: string
 *           description: ID of the chapter this question belongs to
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           description: Difficulty level of the question
 *         marks:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           description: Marks for the question
 *         isActive:
 *           type: boolean
 *           description: Whether the question is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a new question
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionText
 *               - options
 *               - chapter
 *             properties:
 *               questionText:
 *                 type: string
 *                 description: The text of the question
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
 *               explanation:
 *                 type: string
 *                 description: Explanation for the question
 *               chapter:
 *                 type: string
 *                 description: ID of the chapter
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 default: medium
 *               marks:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 1
 *     responses:
 *       201:
 *         description: Question created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Chapter not found
 *       500:
 *         description: Internal server error
 */
router.post('/', validateRequestWithJoi(createQuestionSchema), questionController.createQuestion);

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Get all questions
 *     tags: [Questions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of questions per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by question text
 *       - in: query
 *         name: chapter
 *         schema:
 *           type: string
 *         description: Filter by chapter ID
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject ID
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', validateRequestWithJoi(getQuestionsSchema), questionController.getAllQuestions);

/**
 * @swagger
 * /api/questions/stats:
 *   get:
 *     summary: Get question statistics
 *     tags: [Questions]
 *     parameters:
 *       - in: query
 *         name: chapter
 *         schema:
 *           type: string
 *         description: Filter by chapter ID
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject ID
 *     responses:
 *       200:
 *         description: Question statistics retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/stats', validateRequestWithJoi(getQuestionStatsSchema), questionController.getQuestionStats);

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Get question by ID
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question retrieved successfully
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', validateRequestWithJoi(getQuestionByIdSchema), questionController.getQuestionById);

/**
 * @swagger
 * /api/questions/chapter/{chapterId}:
 *   get:
 *     summary: Get questions by chapter
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of questions per page
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *       404:
 *         description: Chapter not found
 *       500:
 *         description: Internal server error
 */
router.get('/chapter/:chapterId', validateRequestWithJoi(getQuestionsByChapterSchema), questionController.getQuestionsByChapter);

/**
 * @swagger
 * /api/questions/subject/{subjectId}:
 *   get:
 *     summary: Get questions by subject
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of questions per page
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.get('/subject/:subjectId', validateRequestWithJoi(getQuestionsBySubjectSchema), questionController.getQuestionsBySubject);

/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Update question
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               questionText:
 *                 type: string
 *                 description: The text of the question
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
 *               explanation:
 *                 type: string
 *                 description: Explanation for the question
 *               chapter:
 *                 type: string
 *                 description: ID of the chapter
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               marks:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               isActive:
 *                 type: boolean
 *                 description: Whether the question is active
 *     responses:
 *       200:
 *         description: Question updated successfully
 *       404:
 *         description: Question not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.put('/:id', validateRequestWithJoi(updateQuestionSchema), questionController.updateQuestion);

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete question
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', validateRequestWithJoi(getQuestionByIdSchema), questionController.deleteQuestion);

module.exports = router;

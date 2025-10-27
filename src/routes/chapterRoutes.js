const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapterController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Chapter:
 *       type: object
 *       required:
 *         - name
 *         - subject
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the chapter
 *         name:
 *           type: string
 *           description: The name of the chapter
 *         description:
 *           type: string
 *           description: Description of the chapter
 *         subject:
 *           type: string
 *           description: ID of the subject this chapter belongs to
 *         order:
 *           type: integer
 *           description: Order of the chapter within the subject
 *         isActive:
 *           type: boolean
 *           description: Whether the chapter is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/chapters:
 *   post:
 *     summary: Create a new chapter
 *     tags: [Chapters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subject
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the chapter
 *               description:
 *                 type: string
 *                 description: Description of the chapter
 *               subject:
 *                 type: string
 *                 description: ID of the subject
 *               order:
 *                 type: integer
 *                 minimum: 0
 *                 description: Order of the chapter
 *     responses:
 *       201:
 *         description: Chapter created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.post('/', chapterController.createChapter);

/**
 * @swagger
 * /api/chapters:
 *   get:
 *     summary: Get all chapters
 *     tags: [Chapters]
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
 *         description: Number of chapters per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by chapter name
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Chapters retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', chapterController.getAllChapters);

/**
 * @swagger
 * /api/chapters/{id}:
 *   get:
 *     summary: Get chapter by ID
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter retrieved successfully
 *       404:
 *         description: Chapter not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', chapterController.getChapterById);

/**
 * @swagger
 * /api/chapters/subject/{subjectId}:
 *   get:
 *     summary: Get chapters by subject
 *     tags: [Chapters]
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
 *         description: Number of chapters per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Chapters retrieved successfully
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.get('/subject/:subjectId', chapterController.getChaptersBySubject);

/**
 * @swagger
 * /api/chapters/{id}:
 *   put:
 *     summary: Update chapter
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the chapter
 *               description:
 *                 type: string
 *                 description: Description of the chapter
 *               subject:
 *                 type: string
 *                 description: ID of the subject
 *               order:
 *                 type: integer
 *                 minimum: 0
 *                 description: Order of the chapter
 *               isActive:
 *                 type: boolean
 *                 description: Whether the chapter is active
 *     responses:
 *       200:
 *         description: Chapter updated successfully
 *       404:
 *         description: Chapter not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.put('/:id', chapterController.updateChapter);

/**
 * @swagger
 * /api/chapters/{id}:
 *   delete:
 *     summary: Delete chapter
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *     responses:
 *       200:
 *         description: Chapter deleted successfully
 *       404:
 *         description: Chapter not found
 *       400:
 *         description: Cannot delete chapter with existing questions
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', chapterController.deleteChapter);

module.exports = router;

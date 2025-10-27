const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Subject:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the subject
 *         name:
 *           type: string
 *           description: The name of the subject
 *         description:
 *           type: string
 *           description: Description of the subject
 *         isActive:
 *           type: boolean
 *           description: Whether the subject is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/subjects:
 *   post:
 *     summary: Create a new subject
 *     tags: [Subjects]
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
 *                 description: Name of the subject
 *               description:
 *                 type: string
 *                 description: Description of the subject
 *     responses:
 *       201:
 *         description: Subject created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/', subjectController.createSubject);

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Subjects]
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
 *         description: Number of subjects per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by subject name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Subjects retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', subjectController.getAllSubjects);

/**
 * @swagger
 * /api/subjects/deleted:
 *   get:
 *     summary: Get all soft deleted subjects
 *     tags: [Subjects]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Deleted subjects retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/deleted', subjectController.getDeletedSubjects);

/**
 * @swagger
 * /api/subjects/{id}:
 *   get:
 *     summary: Get subject by ID
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject retrieved successfully
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', subjectController.getSubjectById);

/**
 * @swagger
 * /api/subjects/{id}:
 *   put:
 *     summary: Update subject
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the subject
 *               description:
 *                 type: string
 *                 description: Description of the subject
 *               isActive:
 *                 type: boolean
 *                 description: Whether the subject is active
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *       404:
 *         description: Subject not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.put('/:id', subjectController.updateSubject);

/**
 * @swagger
 * /api/subjects/{id}:
 *   delete:
 *     summary: Delete subject
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 *       404:
 *         description: Subject not found
 *       400:
 *         description: Cannot delete subject with existing chapters
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', subjectController.deleteSubject);

/**
 * @swagger
 * /api/subjects/{id}/restore:
 *   patch:
 *     summary: Restore a soft deleted subject
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject restored successfully
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/restore', subjectController.restoreSubject);

module.exports = router;

const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/auth');
const { createSessionValidation, requestSessionValidation, updateSessionValidation, acceptSessionRequestValidation, rejectSessionRequestValidation, teacherScheduleSessionValidation, cancelSessionValidation, rescheduleSessionValidation } = require('../validations/sessionValidation');
const { validateRequest } = require('../middleware/validateRequest');

/**
 * @swagger
 * /api/v1/sessions:
 *   post:
 *     summary: Create a new Session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startTime
 *               - endTime
 *               - teacher
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               focusOne:
 *                 type: string
 *                 format: objectId
 *               cohort:
 *                 type: string
 *                 format: objectId
 *               subject:
 *                 type: string
 *                 format: objectId
 *               teacher:
 *                 type: string
 *                 format: objectId
 *               meetingLink:
 *                 type: string
 *                 format: uri
 *               meetingPlatform:
 *                 type: string
 *                 enum: [jitsi-meet]
 *     responses:
 *       201:
 *         description: Session created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', protect, authorize('admin'), createSessionValidation, validateRequest, sessionController.createSession);

/**
 * @swagger
 * /api/v1/sessions:
 *   get:
 *     summary: Get all Sessions
 *     tags: [Sessions]
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
 *         name: focusOne
 *         schema:
 *           type: string
 *       - in: query
 *         name: cohort
 *         schema:
 *           type: string
 *       - in: query
 *         name: teacher
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, ongoing, completed, cancelled]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, sessionController.getAllSessions);

/**
 * @swagger
 * /api/v1/sessions/deleted:
 *   get:
 *     summary: Get all deleted Sessions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/deleted', protect, authorize('admin'), sessionController.getDeletedSessions);

/**
 * @swagger
 * /api/v1/sessions/{id}:
 *   get:
 *     summary: Get Session by ID
 *     tags: [Sessions]
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
 *         description: Session retrieved successfully
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /api/v1/sessions/request:
 *   post:
 *     summary: Request a new session (Student endpoint)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startTime
 *               - endTime
 *               - focusOne
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               focusOne:
 *                 type: string
 *                 format: objectId
 *               subject:
 *                 type: string
 *                 format: objectId
 *     responses:
 *       201:
 *         description: Session request created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/request', protect, requestSessionValidation, validateRequest, sessionController.requestSession);

/**
 * @swagger
 * /api/v1/sessions/available-slots:
 *   get:
 *     summary: Get available time slots for a subject on a specific date
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: focusOne
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: query
 *         name: subject
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *           default: 75
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get('/available-slots', protect, sessionController.getAvailableSlots);

/**
 * @swagger
 * /api/v1/sessions/teacher/requests:
 *   get:
 *     summary: Get session requests for teacher
 *     tags: [Sessions]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [requested, accepted, rejected, scheduled]
 *     responses:
 *       200:
 *         description: Session requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/teacher/requests', protect, sessionController.getTeacherSessionRequests);

/**
 * @swagger
 * /api/v1/sessions/teacher/schedule:
 *   post:
 *     summary: Schedule a session directly (Teacher endpoint)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - startTime
 *               - endTime
 *               - focusOne
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               focusOne:
 *                 type: string
 *                 format: objectId
 *               subject:
 *                 type: string
 *                 format: objectId
 *     responses:
 *       201:
 *         description: Session scheduled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/teacher/schedule', protect, teacherScheduleSessionValidation, validateRequest, sessionController.teacherScheduleSession);

/**
 * @swagger
 * /api/v1/sessions/{id}/accept:
 *   post:
 *     summary: Accept a session request (Teacher endpoint)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               meetingLink:
 *                 type: string
 *                 format: uri
 *               meetingPlatform:
 *                 type: string
 *                 enum: [jitsi-meet]
 *     responses:
 *       200:
 *         description: Session request accepted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/:id/accept', protect, acceptSessionRequestValidation, validateRequest, sessionController.acceptSessionRequest);

/**
 * @swagger
 * /api/v1/sessions/{id}/reject:
 *   post:
 *     summary: Reject a session request (Teacher endpoint)
 *     tags: [Sessions]
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
 *         description: Session request rejected
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/:id/reject', protect, sessionController.rejectSessionRequest);

/**
 * @swagger
 * /api/v1/sessions/{id}/cancel:
 *   post:
 *     summary: Cancel a session (Student or Teacher endpoint)
 *     tags: [Sessions]
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
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Session cancelled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/:id/cancel', protect, cancelSessionValidation, validateRequest, sessionController.cancelSession);

/**
 * @swagger
 * /api/v1/sessions/{id}/reschedule:
 *   post:
 *     summary: Reschedule a session (Student or Teacher endpoint)
 *     tags: [Sessions]
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
 *             required:
 *               - startTime
 *               - endTime
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Session rescheduled successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/:id/reschedule', protect, rescheduleSessionValidation, validateRequest, sessionController.rescheduleSession);

router.get('/:id', protect, sessionController.getSessionById);

/**
 * @swagger
 * /api/v1/sessions/{id}:
 *   put:
 *     summary: Update Session
 *     tags: [Sessions]
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
 *         description: Session updated successfully
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id', protect, authorize('admin'), updateSessionValidation, validateRequest, sessionController.updateSession);

/**
 * @swagger
 * /api/v1/sessions/{id}:
 *   delete:
 *     summary: Delete Session (soft delete)
 *     tags: [Sessions]
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
 *         description: Session deleted successfully
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/:id', protect, authorize('admin'), sessionController.deleteSession);

/**
 * @swagger
 * /api/v1/sessions/{id}/restore:
 *   patch:
 *     summary: Restore soft deleted Session
 *     tags: [Sessions]
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
 *         description: Session restored successfully
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.patch('/:id/restore', protect, authorize('admin'), sessionController.restoreSession);

module.exports = router;


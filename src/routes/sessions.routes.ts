import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/sessions.controller'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /sessions:
 *   get:
 *     tags: [Sessions]
 *     summary: List sessions (teacher sees all theirs, student sees enrolled)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of sessions }
 *   post:
 *     tags: [Sessions]
 *     summary: Create a new session (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduledAt, duration]
 *             properties:
 *               title:       { type: string }
 *               courseId:    { type: string }
 *               scheduledAt: { type: string, format: date-time }
 *               duration:    { type: integer, description: "Duration in minutes" }
 *               type:        { type: string, enum: [ONE_ON_ONE, GROUP] }
 *               notes:       { type: string }
 *               isRecurring: { type: boolean }
 *     responses:
 *       201: { description: Session created }
 */
router.get('/', ctrl.listSessions)
router.post('/', requireRole('TEACHER'), ctrl.createSession)

/**
 * @swagger
 * /sessions/{id}:
 *   patch:
 *     tags: [Sessions]
 *     summary: Update session status or details (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:      { type: string, enum: [SCHEDULED, ONGOING, COMPLETED, CANCELLED] }
 *               meetingUrl:  { type: string }
 *               recordingUrl: { type: string }
 *     responses:
 *       200: { description: Updated session }
 *   delete:
 *     tags: [Sessions]
 *     summary: Delete a session (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Session deleted }
 */
router.patch('/:id', requireRole('TEACHER'), ctrl.updateSession)
router.delete('/:id', requireRole('TEACHER'), ctrl.deleteSession)

/**
 * @swagger
 * /sessions/{id}/attendance:
 *   post:
 *     tags: [Sessions]
 *     summary: Mark attendance for a student in a session (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, status]
 *             properties:
 *               studentId: { type: string }
 *               status:    { type: string, enum: [PRESENT, LATE, ABSENT] }
 *     responses:
 *       200: { description: Attendance record upserted }
 */
router.post('/:id/attendance', requireRole('TEACHER'), ctrl.markAttendance)

export default router

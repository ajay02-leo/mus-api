import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/assignments.controller'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /assignments:
 *   get:
 *     tags: [Assignments]
 *     summary: List assignments (teacher sees all theirs; student sees from enrolled courses)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of assignments }
 *   post:
 *     tags: [Assignments]
 *     summary: Create assignment (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:                 { type: string }
 *               description:           { type: string }
 *               type:                  { type: string, enum: [PRACTICE, PERFORMANCE, THEORY] }
 *               raga:                  { type: string }
 *               dueDate:               { type: string, format: date-time }
 *               courseId:              { type: string }
 *               referenceRecordingUrl: { type: string }
 *     responses:
 *       201: { description: Assignment created }
 */
router.get('/', ctrl.listAssignments)
router.post('/', requireRole('TEACHER'), ctrl.createAssignment)

/**
 * @swagger
 * /assignments/{id}:
 *   get:
 *     tags: [Assignments]
 *     summary: Get assignment with all submissions (teacher)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Assignment detail with submissions }
 *   delete:
 *     tags: [Assignments]
 *     summary: Delete assignment (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Assignment deleted }
 */
router.get('/:id', ctrl.getAssignment)
router.delete('/:id', requireRole('TEACHER'), ctrl.deleteAssignment)

/**
 * @swagger
 * /assignments/{id}/submit:
 *   post:
 *     tags: [Assignments]
 *     summary: Submit an assignment (student only)
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
 *               recordingUrl: { type: string }
 *               notes:        { type: string }
 *     responses:
 *       200: { description: Submission upserted }
 */
router.post('/:id/submit', requireRole('STUDENT'), ctrl.submitAssignment)

/**
 * @swagger
 * /assignments/{id}/grade:
 *   post:
 *     tags: [Assignments]
 *     summary: Grade a student's submission (teacher only)
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
 *             required: [submissionId, score]
 *             properties:
 *               submissionId: { type: string }
 *               score:        { type: integer, minimum: 0, maximum: 100 }
 *               feedback:     { type: string }
 *     responses:
 *       200: { description: Submission graded }
 */
router.post('/:id/grade', requireRole('TEACHER'), ctrl.gradeSubmission)

export default router

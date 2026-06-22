import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/students.controller'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /students:
 *   get:
 *     tags: [Students]
 *     summary: List all students enrolled in teacher's courses
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: List of students with stats }
 */
router.get('/', requireRole('TEACHER', 'ADMIN'), ctrl.listStudents)

/**
 * @swagger
 * /students/me/stats:
 *   get:
 *     tags: [Students]
 *     summary: Get student's own dashboard stats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Student stats including attendance and score averages }
 */
router.get('/me/stats', requireRole('STUDENT'), ctrl.myStats)

/**
 * @swagger
 * /students/me/profile:
 *   put:
 *     tags: [Students]
 *     summary: Update student's own profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName: { type: string }
 *               bio:         { type: string }
 *               avatar:      { type: string }
 *     responses:
 *       200: { description: Updated profile }
 */
router.put('/me/profile', requireRole('STUDENT'), ctrl.updateMyProfile)

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Get a specific student's full profile (teacher/admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Student profile with all relations }
 *       404: { description: Student not found }
 */
router.get('/:id', requireRole('TEACHER', 'ADMIN'), ctrl.getStudent)

export default router

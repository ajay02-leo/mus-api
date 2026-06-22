import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/courses.controller'

const router = Router()

/**
 * @swagger
 * /courses:
 *   get:
 *     tags: [Courses]
 *     summary: Browse published courses (public)
 *     parameters:
 *       - in: query
 *         name: level
 *         schema: { type: string, enum: [BEGINNER, INTERMEDIATE, ADVANCED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Array of published courses }
 *   post:
 *     tags: [Courses]
 *     summary: Create a course (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:       { type: string }
 *               description: { type: string }
 *               level:       { type: string, enum: [BEGINNER, INTERMEDIATE, ADVANCED] }
 *               ragas:       { type: array, items: { type: string } }
 *               price:       { type: number }
 *     responses:
 *       201: { description: Course created }
 */
router.get('/', ctrl.browseCourses)
router.post('/', authenticate, requireRole('TEACHER'), ctrl.createCourse)

/**
 * @swagger
 * /courses/my:
 *   get:
 *     tags: [Courses]
 *     summary: Get teacher's own courses
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Teacher's courses with counts }
 */
router.get('/my', authenticate, requireRole('TEACHER'), ctrl.myCourses)

/**
 * @swagger
 * /courses/enrolled:
 *   get:
 *     tags: [Courses]
 *     summary: Get student's enrolled courses
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Student's enrollments with course details }
 */
router.get('/enrolled', authenticate, requireRole('STUDENT'), ctrl.myEnrollments)

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     tags: [Courses]
 *     summary: Get course detail (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Course detail }
 *   put:
 *     tags: [Courses]
 *     summary: Update a course (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated course }
 *   delete:
 *     tags: [Courses]
 *     summary: Delete a course (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Course deleted }
 */
router.get('/:id', ctrl.getCourse)
router.put('/:id', authenticate, requireRole('TEACHER'), ctrl.updateCourse)
router.delete('/:id', authenticate, requireRole('TEACHER'), ctrl.deleteCourse)

/**
 * @swagger
 * /courses/{id}/enroll:
 *   post:
 *     tags: [Courses]
 *     summary: Enroll in a course (student only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Enrollment created }
 *       409: { description: Already enrolled }
 */
router.post('/:id/enroll', authenticate, requireRole('STUDENT'), ctrl.enrollInCourse)

export default router

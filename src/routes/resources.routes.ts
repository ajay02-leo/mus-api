import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/resources.controller'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /resources:
 *   get:
 *     tags: [Resources]
 *     summary: Teacher - list own resources; Student - list shared with them
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of resources }
 *   post:
 *     tags: [Resources]
 *     summary: Create a resource (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type, url]
 *             properties:
 *               title: { type: string }
 *               type:  { type: string, enum: [PDF, AUDIO, VIDEO, LINK] }
 *               url:   { type: string }
 *               raga:  { type: string }
 *               level: { type: string, enum: [BEGINNER, INTERMEDIATE, ADVANCED] }
 *     responses:
 *       201: { description: Resource created }
 */
router.get('/', (req, res) =>
  req.user?.role === 'TEACHER' ? ctrl.listResources(req as any, res) : ctrl.myResources(req as any, res),
)
router.post('/', requireRole('TEACHER'), ctrl.createResource)

/**
 * @swagger
 * /resources/{id}/share:
 *   post:
 *     tags: [Resources]
 *     summary: Share a resource with students (teacher only)
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
 *             required: [studentIds]
 *             properties:
 *               studentIds: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Resource shared }
 */
router.post('/:id/share', requireRole('TEACHER'), ctrl.shareResource)

/**
 * @swagger
 * /resources/{id}:
 *   delete:
 *     tags: [Resources]
 *     summary: Delete a resource (teacher only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Resource deleted }
 */
router.delete('/:id', requireRole('TEACHER'), ctrl.deleteResource)

export default router

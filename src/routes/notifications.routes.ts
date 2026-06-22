import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ctrl from '../controllers/notifications.controller'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List last 50 notifications for current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of notifications }
 */
router.get('/', ctrl.listNotifications)

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: All marked read }
 */
router.patch('/read-all', ctrl.markAllRead)

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a specific notification as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notification marked read }
 */
router.patch('/:id/read', ctrl.markRead)

export default router

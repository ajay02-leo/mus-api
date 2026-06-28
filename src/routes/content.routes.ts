import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/content.controller'

const router = Router()
router.use(authenticate, requireRole('ADMIN', 'CONTENT_MANAGER'))

// Broadcast
router.post('/broadcast', ctrl.broadcastNotification)

// Events (full management — includes unpublished)
router.get('/events',              ctrl.listAllEvents)
router.post('/events',             ctrl.createEvent)
router.patch('/events/:id',        ctrl.updateEvent)
router.delete('/events/:id',       ctrl.deleteEvent)
router.patch('/events/:id/toggle', ctrl.toggleEventPublish)

// Community moderation
router.get('/posts',          ctrl.listPostsAdmin)
router.patch('/posts/:id/pin', ctrl.pinPost)
router.delete('/posts/:id',   ctrl.deletePost)

// Stats
router.get('/stats', ctrl.contentStats)

export default router

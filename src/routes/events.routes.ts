import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/events.controller'

const router = Router()

router.get('/', ctrl.listEvents)

router.use(authenticate)
router.get('/my-registrations', ctrl.myRegistrations)
router.post('/',       requireRole('ADMIN'), ctrl.createEvent)
router.post('/:id/register', ctrl.registerForEvent)

export default router

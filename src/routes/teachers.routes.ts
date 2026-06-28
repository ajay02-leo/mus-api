import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/teachers.controller'

const router = Router()
router.use(authenticate, requireRole('TEACHER'))

router.get('/me/profile',  ctrl.getMyProfile)
router.put('/me/profile',  ctrl.updateMyProfile)

export default router

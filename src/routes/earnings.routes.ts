import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/earnings.controller'

const router = Router()
router.use(authenticate, requireRole('TEACHER'))

router.get('/', ctrl.myEarnings)

export default router

import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/gamification.controller'

const router = Router()
router.use(authenticate)

router.get('/leaderboard', ctrl.getLeaderboard)
router.get('/my-badges',   requireRole('STUDENT'), ctrl.getMyBadges)

export default router

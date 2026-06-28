import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ctrl from '../controllers/ai.controller'

const router = Router()
router.use(authenticate)

router.post('/chat', ctrl.chat)

export default router

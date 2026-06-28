import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ctrl from '../controllers/settings.controller'

const router = Router()
router.use(authenticate)

router.get('/',  ctrl.getSettings)
router.put('/',  ctrl.updateSettings)

export default router

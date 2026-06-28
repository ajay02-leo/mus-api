import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ctrl from '../controllers/community.controller'

const router = Router()

router.get('/posts',        ctrl.listPosts)
router.get('/stats',        ctrl.communityStats)
router.get('/posts/:id/comments', ctrl.listComments)

router.use(authenticate)
router.post('/posts',               ctrl.createPost)
router.post('/posts/:id/like',      ctrl.toggleLike)
router.post('/posts/:id/bookmark',  ctrl.toggleBookmark)
router.post('/posts/:id/comments',  ctrl.addComment)

export default router

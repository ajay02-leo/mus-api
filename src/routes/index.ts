import { Router } from 'express'
import authRoutes          from './auth.routes'
import studentsRoutes      from './students.routes'
import sessionsRoutes      from './sessions.routes'
import assignmentsRoutes   from './assignments.routes'
import coursesRoutes       from './courses.routes'
import resourcesRoutes     from './resources.routes'
import notificationsRoutes from './notifications.routes'
import reportsRoutes       from './reports.routes'

const router = Router()

router.use('/auth',          authRoutes)
router.use('/students',      studentsRoutes)
router.use('/sessions',      sessionsRoutes)
router.use('/assignments',   assignmentsRoutes)
router.use('/courses',       coursesRoutes)
router.use('/resources',     resourcesRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/reports',       reportsRoutes)

export default router

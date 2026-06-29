import { Router } from 'express'
import authRoutes          from './auth.routes'
import studentsRoutes      from './students.routes'
import sessionsRoutes      from './sessions.routes'
import assignmentsRoutes   from './assignments.routes'
import coursesRoutes       from './courses.routes'
import resourcesRoutes     from './resources.routes'
import notificationsRoutes from './notifications.routes'
import reportsRoutes       from './reports.routes'
import adminRoutes         from './admin.routes'
import earningsRoutes      from './earnings.routes'
import aiRoutes            from './ai.routes'
import settingsRoutes      from './settings.routes'
import teachersRoutes      from './teachers.routes'
import eventsRoutes        from './events.routes'
import communityRoutes     from './community.routes'
import contentRoutes       from './content.routes'
import recordingsRoutes    from './recordings.routes'

const router = Router()

router.use('/auth',          authRoutes)
router.use('/students',      studentsRoutes)
router.use('/sessions',      sessionsRoutes)
router.use('/assignments',   assignmentsRoutes)
router.use('/courses',       coursesRoutes)
router.use('/resources',     resourcesRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/reports',       reportsRoutes)
router.use('/admin',         adminRoutes)
router.use('/earnings',      earningsRoutes)
router.use('/ai',            aiRoutes)
router.use('/settings',      settingsRoutes)
router.use('/teachers',      teachersRoutes)
router.use('/events',        eventsRoutes)
router.use('/community',     communityRoutes)
router.use('/content',       contentRoutes)
router.use('/recordings',    recordingsRoutes)

export default router

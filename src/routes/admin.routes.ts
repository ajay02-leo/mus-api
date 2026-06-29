import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/admin.controller'

const router = Router()
router.use(authenticate, requireRole('ADMIN'))

// Users
router.get('/users',               ctrl.listUsers)
router.patch('/users/:id/suspend', ctrl.suspendUser)
router.patch('/users/:id/restore', ctrl.restoreUser)
router.get('/stats',               ctrl.platformStats)

// Courses approval
router.get('/courses',                   ctrl.listCourses)
router.patch('/courses/:id/approve',     ctrl.approveCourse)
router.patch('/courses/:id/reject',      ctrl.rejectCourse)

// Teacher verification
router.get('/teachers',                        ctrl.listTeachers)
router.patch('/teachers/:id/verify',           ctrl.verifyTeacher)
router.patch('/teachers/:id/unverify',         ctrl.unverifyTeacher)

// Payments
router.get('/payments',                  ctrl.listPayments)

export default router

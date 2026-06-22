import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import * as ctrl from '../controllers/reports.controller'

const router = Router()
router.use(authenticate, requireRole('TEACHER', 'ADMIN'))

/**
 * @swagger
 * /reports/monthly:
 *   get:
 *     tags: [Reports]
 *     summary: Monthly student progress report for teacher
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema: { type: integer, minimum: 1, maximum: 12 }
 *         description: Month number (1-12). Defaults to current month.
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Year (e.g. 2026). Defaults to current year.
 *     responses:
 *       200: { description: Report with per-student attendance and assignment data }
 */
router.get('/monthly', ctrl.monthlyReport)

export default router

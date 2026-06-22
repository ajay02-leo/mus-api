import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import * as ctrl from '../controllers/auth.controller'
import { z } from 'zod'

const router = Router()

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, role]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name:     { type: string }
 *               role:     { type: string, enum: [STUDENT, TEACHER] }
 *     responses:
 *       201: { description: User created, token returned }
 *       409: { description: Email already registered }
 */
router.post('/register',
  validate(z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    role: z.enum(['STUDENT', 'TEACHER']),
  })),
  ctrl.register,
)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and get JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful, token and user returned }
 *       401: { description: Incorrect password }
 *       404: { description: Email not found }
 */
router.post('/login',
  validate(z.object({ email: z.string().email(), password: z.string() })),
  ctrl.login,
)

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (clears cookie)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', ctrl.logout)

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user object }
 *       401: { description: Not authenticated }
 */
router.get('/me', authenticate, ctrl.me)

/**
 * @swagger
 * /auth/password:
 *   patch:
 *     tags: [Auth]
 *     summary: Update own password
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:     { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password updated }
 *       401: { description: Incorrect current password }
 */
router.patch('/password',
  authenticate,
  validate(z.object({ currentPassword: z.string(), newPassword: z.string().min(8) })),
  ctrl.updatePassword,
)

export default router

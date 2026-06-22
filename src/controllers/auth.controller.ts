import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { signToken } from '../lib/jwt'
import { hashPassword, verifyPassword } from '../lib/password'
import { AuthRequest } from '../middleware/auth'

const safeUser = (u: any) => {
  const { password: _, ...rest } = u
  return rest
}

export async function register(req: Request, res: Response) {
  const { email, password, name, role } = req.body
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ success: false, message: 'Email already registered' })

  const hashed = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email, password: hashed, role,
      ...(role === 'STUDENT'
        ? { student: { create: { displayName: name } } }
        : { teacher: { create: { displayName: name } } }),
    },
    include: { student: true, teacher: true },
  })

  const token = signToken({ userId: user.id, role: user.role })
  return res.status(201).json({ success: true, token, user: safeUser(user) })
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({
    where: { email },
    include: { student: true, teacher: true },
  })
  if (!user) return res.status(404).json({ success: false, message: 'No account with that email' })

  const valid = await verifyPassword(password, user.password)
  if (!valid) return res.status(401).json({ success: false, message: 'Incorrect password' })

  const token = signToken({ userId: user.id, role: user.role })

  // Set cookie for web clients (mobile uses the token from the response body)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })

  return res.json({ success: true, token, user: safeUser(user) })
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('token')
  return res.json({ success: true, message: 'Logged out' })
}

export async function me(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { student: true, teacher: true },
  })
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  return res.json({ success: true, user: safeUser(user) })
}

export async function updatePassword(req: AuthRequest, res: Response) {
  const { currentPassword, newPassword } = req.body
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })

  const valid = await verifyPassword(currentPassword, user.password)
  if (!valid) return res.status(401).json({ success: false, message: 'Incorrect current password' })

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(newPassword) },
  })
  return res.json({ success: true, message: 'Password updated' })
}

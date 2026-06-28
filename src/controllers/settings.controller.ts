import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function getSettings(req: AuthRequest, res: Response) {
  const settings = await prisma.userSettings.upsert({
    where: { userId: req.user!.userId },
    create: { userId: req.user!.userId },
    update: {},
  })
  return res.json({ success: true, settings })
}

export async function updateSettings(req: AuthRequest, res: Response) {
  const settings = await prisma.userSettings.upsert({
    where: { userId: req.user!.userId },
    create: { userId: req.user!.userId, ...req.body },
    update: req.body,
  })
  return res.json({ success: true, settings })
}

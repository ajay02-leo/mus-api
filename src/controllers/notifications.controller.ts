import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function listNotifications(req: AuthRequest, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return res.json({ success: true, notifications })
}

export async function markRead(req: AuthRequest, res: Response) {
  const notification = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  })
  return res.json({ success: true, notification })
}

export async function markAllRead(req: AuthRequest, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, read: false },
    data: { read: true },
  })
  return res.json({ success: true, message: 'All notifications marked as read' })
}

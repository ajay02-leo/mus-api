import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function updateMyProfile(req: AuthRequest, res: Response) {
  const { displayName, bio, specialization, hourlyRate, avatar } = req.body
  const data: any = {
    ...(displayName    !== undefined && { displayName }),
    ...(bio            !== undefined && { bio }),
    ...(specialization !== undefined && { specialization }),
    ...(hourlyRate     !== undefined && { hourlyRate: Number(hourlyRate) }),
    ...(avatar         !== undefined && { avatar }),
  }
  const profile = await prisma.teacherProfile.upsert({
    where: { userId: req.user!.userId },
    update: data,
    create: { userId: req.user!.userId, displayName: displayName ?? 'Teacher', ...data },
  })
  return res.json({ success: true, profile })
}

export async function getMyProfile(req: AuthRequest, res: Response) {
  let profile = await prisma.teacherProfile.findUnique({
    where: { userId: req.user!.userId },
    include: { user: { select: { email: true } } },
  })
  if (!profile) {
    profile = await prisma.teacherProfile.create({
      data: { userId: req.user!.userId, displayName: 'Teacher' },
      include: { user: { select: { email: true } } },
    })
  }
  return res.json({ success: true, profile })
}

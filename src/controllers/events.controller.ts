import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function listEvents(_req: Request, res: Response) {
  const events = await prisma.event.findMany({
    where: { isPublished: true },
    orderBy: { date: 'asc' },
    include: { _count: { select: { registrations: true } } },
  })
  return res.json({ success: true, events })
}

export async function createEvent(req: AuthRequest, res: Response) {
  const event = await prisma.event.create({
    data: { ...req.body, date: new Date(req.body.date) },
  })
  return res.status(201).json({ success: true, event })
}

export async function registerForEvent(req: AuthRequest, res: Response) {
  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: req.params.id, userId: req.user!.userId } },
  })
  if (existing) return res.status(409).json({ success: false, message: 'Already registered' })

  const event = await prisma.event.findUnique({ where: { id: req.params.id } })
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' })
  if (event.booked >= event.seats) return res.status(400).json({ success: false, message: 'Event is full' })

  const [registration] = await prisma.$transaction([
    prisma.eventRegistration.create({ data: { eventId: req.params.id, userId: req.user!.userId } }),
    prisma.event.update({ where: { id: req.params.id }, data: { booked: { increment: 1 } } }),
  ])

  return res.status(201).json({ success: true, registration })
}

export async function myRegistrations(req: AuthRequest, res: Response) {
  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: req.user!.userId },
    select: { eventId: true },
  })
  return res.json({ success: true, eventIds: registrations.map(r => r.eventId) })
}

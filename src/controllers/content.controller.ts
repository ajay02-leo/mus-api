import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

// ── Broadcast Notifications ──────────────────────────────────────────────────

export async function broadcastNotification(req: AuthRequest, res: Response) {
  const { title, body, type = 'ANNOUNCEMENT', targetRole } = req.body
  if (!title || !body) return res.status(400).json({ success: false, message: 'title and body are required' })

  const whereRole: any = targetRole && targetRole !== 'ALL' ? { role: targetRole } : undefined
  const users = await prisma.user.findMany({
    where: { ...whereRole, status: 'ACTIVE' },
    select: { id: true },
  })

  await prisma.notification.createMany({
    data: users.map(u => ({ userId: u.id, type, title, body })),
  })

  return res.json({ success: true, sent: users.length, message: `Notification sent to ${users.length} users` })
}

// ── Events Management ────────────────────────────────────────────────────────

export async function listAllEvents(_req: AuthRequest, res: Response) {
  const events = await prisma.event.findMany({
    orderBy: { date: 'asc' },
    include: { _count: { select: { registrations: true } } },
  })
  return res.json({ success: true, events })
}

export async function createEvent(req: AuthRequest, res: Response) {
  const { title, description, type, artists, date, time, venue, seats, price, tags, isPublished } = req.body
  if (!title || !date || !venue) return res.status(400).json({ success: false, message: 'title, date, venue are required' })

  const event = await prisma.event.create({
    data: {
      title,
      description: description ?? null,
      type: type ?? 'CONCERT',
      artists: artists ?? [],
      date: new Date(date),
      time: time ?? '',
      venue,
      seats: Number(seats ?? 100),
      price: Number(price ?? 0),
      tags: tags ?? [],
      isPublished: isPublished ?? false,
    },
  })
  return res.status(201).json({ success: true, event })
}

export async function updateEvent(req: AuthRequest, res: Response) {
  const { title, description, type, artists, date, time, venue, seats, price, tags, isPublished } = req.body
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(type !== undefined && { type }),
      ...(artists !== undefined && { artists }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(time !== undefined && { time }),
      ...(venue !== undefined && { venue }),
      ...(seats !== undefined && { seats: Number(seats) }),
      ...(price !== undefined && { price: Number(price) }),
      ...(tags !== undefined && { tags }),
      ...(isPublished !== undefined && { isPublished }),
    },
  })
  return res.json({ success: true, event })
}

export async function deleteEvent(req: AuthRequest, res: Response) {
  await prisma.event.delete({ where: { id: req.params.id } })
  return res.json({ success: true, message: 'Event deleted' })
}

export async function toggleEventPublish(req: AuthRequest, res: Response) {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } })
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' })

  const updated = await prisma.event.update({
    where: { id: req.params.id },
    data: { isPublished: !event.isPublished },
  })
  return res.json({ success: true, event: updated })
}

// ── Community Moderation ─────────────────────────────────────────────────────

export async function listPostsAdmin(_req: AuthRequest, res: Response) {
  const posts = await prisma.post.findMany({
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 100,
    include: {
      author: { select: { email: true, student: { select: { displayName: true } }, teacher: { select: { displayName: true } } } },
      _count: { select: { comments: true } },
    },
  })
  const formatted = posts.map(p => ({
    ...p,
    authorName: p.author.teacher?.displayName ?? p.author.student?.displayName ?? p.author.email,
  }))
  return res.json({ success: true, posts: formatted })
}

export async function pinPost(req: AuthRequest, res: Response) {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } })
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' })
  const updated = await prisma.post.update({ where: { id: req.params.id }, data: { pinned: !post.pinned } })
  return res.json({ success: true, post: updated })
}

export async function deletePost(req: AuthRequest, res: Response) {
  await prisma.post.delete({ where: { id: req.params.id } })
  return res.json({ success: true, message: 'Post deleted' })
}

// ── Content Stats ────────────────────────────────────────────────────────────

export async function contentStats(_req: AuthRequest, res: Response) {
  const now = new Date()
  const [totalEvents, upcomingEvents, publishedEvents, totalPosts, pinnedPosts, totalNotifications] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({ where: { date: { gte: now }, isPublished: true } }),
    prisma.event.count({ where: { isPublished: true } }),
    prisma.post.count(),
    prisma.post.count({ where: { pinned: true } }),
    prisma.notification.count({ where: { type: 'ANNOUNCEMENT' } }),
  ])

  return res.json({
    success: true,
    stats: { totalEvents, upcomingEvents, publishedEvents, totalPosts, pinnedPosts, totalNotifications },
  })
}

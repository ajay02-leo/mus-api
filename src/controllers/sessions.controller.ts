import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function listSessions(req: AuthRequest, res: Response) {
  const { userId, role } = req.user!

  if (role === 'TEACHER') {
    const teacher = await prisma.teacherProfile.findUnique({ where: { userId } })
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' })

    const sessions = await prisma.session.findMany({
      where: { teacherId: teacher.id },
      include: { attendance: { include: { student: true } }, course: true },
      orderBy: { scheduledAt: 'asc' },
    })
    return res.json({ success: true, sessions })
  }

  const student = await prisma.studentProfile.findUnique({ where: { userId } })
  if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' })

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id, status: 'ACTIVE' },
    select: { courseId: true },
  })
  const sessions = await prisma.session.findMany({
    where: { courseId: { in: enrollments.map(e => e.courseId) } },
    include: { teacher: { select: { displayName: true, avatar: true } }, attendance: { where: { studentId: student.id } } },
    orderBy: { scheduledAt: 'asc' },
  })
  return res.json({ success: true, sessions })
}

export async function createSession(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' })

  const session = await prisma.session.create({
    data: { ...req.body, teacherId: teacher.id, scheduledAt: new Date(req.body.scheduledAt) },
  })
  return res.status(201).json({ success: true, session })
}

export async function updateSession(req: AuthRequest, res: Response) {
  const session = await prisma.session.update({
    where: { id: req.params.id },
    data: req.body,
  })
  return res.json({ success: true, session })
}

export async function deleteSession(req: AuthRequest, res: Response) {
  await prisma.session.delete({ where: { id: req.params.id } })
  return res.json({ success: true, message: 'Session deleted' })
}

export async function markAttendance(req: AuthRequest, res: Response) {
  const { studentId, status } = req.body
  const record = await prisma.attendance.upsert({
    where: { sessionId_studentId: { sessionId: req.params.id, studentId } },
    create: { sessionId: req.params.id, studentId, status },
    update: { status },
  })
  return res.json({ success: true, attendance: record })
}

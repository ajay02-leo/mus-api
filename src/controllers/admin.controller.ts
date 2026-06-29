import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function listUsers(req: Request, res: Response) {
  const { role, search, page = '1', limit = '50' } = req.query as Record<string, string>

  const users = await prisma.user.findMany({
    where: {
      role: (role && role !== 'ALL') ? (role as any) : undefined,
      OR: search ? [
        { email: { contains: search, mode: 'insensitive' } },
        { student: { displayName: { contains: search, mode: 'insensitive' } } },
        { teacher: { displayName: { contains: search, mode: 'insensitive' } } },
      ] : undefined,
    },
    include: {
      student: { select: { displayName: true } },
      teacher: { select: { displayName: true } },
    },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
  })

  const formatted = users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    status: u.status,
    name: u.teacher?.displayName ?? u.student?.displayName ?? u.email,
    createdAt: u.createdAt,
  }))

  return res.json({ success: true, users: formatted, total: formatted.length })
}

export async function suspendUser(req: AuthRequest, res: Response) {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'SUSPENDED' },
  })
  return res.json({ success: true, status: user.status })
}

export async function restoreUser(req: AuthRequest, res: Response) {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'ACTIVE' },
  })
  return res.json({ success: true, status: user.status })
}

export async function platformStats(req: AuthRequest, res: Response) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalStudents, totalTeachers, totalCourses, monthlyRevenue] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'TEACHER' } }),
    prisma.course.count({ where: { status: 'APPROVED' } }),
    prisma.earning.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: 'COMPLETED' },
      _sum: { amount: true },
    }),
  ])

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const signups = await prisma.user.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { role: true, createdAt: true },
  })

  const monthlySignups: Record<string, { students: number; teachers: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleString('en', { month: 'short' })
    monthlySignups[key] = { students: 0, teachers: 0 }
  }
  for (const u of signups) {
    const key = new Date(u.createdAt).toLocaleString('en', { month: 'short' })
    if (monthlySignups[key]) {
      if (u.role === 'STUDENT') monthlySignups[key].students++
      else if (u.role === 'TEACHER') monthlySignups[key].teachers++
    }
  }

  return res.json({
    success: true,
    stats: { totalStudents, totalTeachers, totalCourses, monthlyRevenue: monthlyRevenue._sum.amount ?? 0 },
    monthlySignups: Object.entries(monthlySignups).map(([month, counts]) => ({ month, ...counts })),
  })
}

export async function listCourses(req: AuthRequest, res: Response) {
  const { status } = req.query as Record<string, string>
  const courses = await prisma.course.findMany({
    where: status && status !== 'ALL' ? { status: status as any } : undefined,
    include: {
      teacher: { select: { displayName: true, user: { select: { email: true } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return res.json({ success: true, courses })
}

export async function approveCourse(req: AuthRequest, res: Response) {
  const course = await prisma.course.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED', isPublished: true },
  })
  return res.json({ success: true, course })
}

export async function rejectCourse(req: AuthRequest, res: Response) {
  const course = await prisma.course.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED', isPublished: false },
  })
  return res.json({ success: true, course })
}

export async function listTeachers(req: Request, res: Response) {
  const { verified, search } = req.query as Record<string, string>
  const teachers = await prisma.teacherProfile.findMany({
    where: {
      ...(verified === 'true' ? { isVerified: true } : verified === 'false' ? { isVerified: false } : {}),
      ...(search ? { displayName: { contains: search, mode: 'insensitive' } } : {}),
    },
    include: {
      user: { select: { id: true, email: true, status: true, createdAt: true } },
      _count: { select: { courses: true, sessions: true } },
    },
    orderBy: { user: { createdAt: 'desc' } },
  })
  return res.json({ success: true, teachers })
}

export async function verifyTeacher(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.update({
    where: { id: req.params.id },
    data: { isVerified: true },
    include: { user: { select: { email: true } } },
  })
  // Notify the teacher
  await prisma.notification.create({
    data: {
      userId: teacher.userId,
      type: 'VERIFICATION',
      title: 'Profile Verified!',
      body: 'Congratulations! Your teacher profile has been verified by the SwaraSangam team. A verified badge is now visible on your profile.',
    },
  })
  return res.json({ success: true, teacher })
}

export async function unverifyTeacher(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.update({
    where: { id: req.params.id },
    data: { isVerified: false },
  })
  return res.json({ success: true, teacher })
}

export async function listPayments(req: AuthRequest, res: Response) {
  const enrollments = await prisma.enrollment.findMany({
    where: { paidAmount: { gt: 0 } },
    include: {
      student: {
        select: { displayName: true, user: { select: { email: true } } },
      },
      course: {
        select: {
          title: true,
          price: true,
          teacher: { select: { displayName: true } },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
    take: 200,
  })

  const payments = enrollments.map(e => ({
    id: e.id,
    studentName: e.student.displayName,
    studentEmail: e.student.user.email,
    courseTitle: e.course.title,
    teacherName: e.course.teacher.displayName,
    amount: e.paidAmount,
    paymentRef: e.paymentRef,
    paidAt: e.enrolledAt,
  }))

  const total = payments.reduce((sum, p) => sum + p.amount, 0)
  return res.json({ success: true, payments, total })
}

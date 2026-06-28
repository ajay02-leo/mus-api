import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function browseCourses(req: Request, res: Response) {
  const { level, search, page = '1', limit = '20' } = req.query as Record<string, string>
  const courses = await prisma.course.findMany({
    where: {
      status: 'APPROVED',
      level: (level as any) ?? undefined,
      title: search ? { contains: search, mode: 'insensitive' } : undefined,
    },
    include: {
      teacher: { select: { displayName: true, avatar: true, rating: true } },
      _count: { select: { enrollments: true } },
    },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
  })
  return res.json({ success: true, courses })
}

export async function getCourse(req: Request, res: Response) {
  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: {
      teacher: { select: { displayName: true, avatar: true, bio: true, rating: true } },
      assignments: { select: { id: true, title: true, type: true } },
      _count: { select: { enrollments: true, sessions: true } },
    },
  })
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' })
  return res.json({ success: true, course })
}

export async function myCourses(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) return res.json({ success: true, courses: [] })

  const courses = await prisma.course.findMany({
    where: { teacherId: teacher.id },
    include: { _count: { select: { enrollments: true, sessions: true, assignments: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return res.json({ success: true, courses })
}

export async function createCourse(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) {
    return res.status(404).json({ success: false, message: 'Teacher profile not found' })
  }

  const { title, description, level, ragas, price } = req.body
  const course = await prisma.course.create({
    data: {
      title,
      description,
      level: level ?? 'BEGINNER',
      ragas: ragas ?? [],
      price: Number(price ?? 0),
      teacherId: teacher.id,
      status: 'PENDING_REVIEW',
      isPublished: false,
    },
  })
  return res.status(201).json({ success: true, course })
}

export async function updateCourse(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) return res.status(403).json({ success: false, message: 'Not a teacher' })

  const course = await prisma.course.findUnique({ where: { id: req.params.id } })
  if (!course || course.teacherId !== teacher.id) {
    return res.status(403).json({ success: false, message: 'Not your course' })
  }

  const { title, description, level, ragas, price } = req.body
  const updated = await prisma.course.update({
    where: { id: req.params.id },
    data: { title, description, level, ragas, price: price !== undefined ? Number(price) : undefined },
  })
  return res.json({ success: true, course: updated })
}

export async function deleteCourse(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) return res.status(403).json({ success: false, message: 'Not a teacher' })

  const course = await prisma.course.findUnique({ where: { id: req.params.id } })
  if (!course || course.teacherId !== teacher.id) {
    return res.status(403).json({ success: false, message: 'Not your course' })
  }

  await prisma.course.delete({ where: { id: req.params.id } })
  return res.json({ success: true, message: 'Course deleted' })
}

export async function enrollInCourse(req: AuthRequest, res: Response) {
  let student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!student) {
    student = await prisma.studentProfile.create({
      data: { userId: req.user!.userId, displayName: 'Student' },
    })
  }

  const course = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: { teacher: { select: { id: true } } },
  })
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' })
  if (course.status !== 'APPROVED') {
    return res.status(400).json({ success: false, message: 'Course is not available for enrollment' })
  }

  const exists = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: student.id, courseId: req.params.id } },
  })
  if (exists) return res.status(409).json({ success: false, message: 'Already enrolled' })

  const { paymentRef, paidAmount } = req.body

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: student.id,
      courseId: req.params.id,
      paymentRef: paymentRef ?? null,
      paidAmount: Number(paidAmount ?? course.price),
    },
  })

  // Record earning for teacher
  await prisma.earning.create({
    data: {
      teacherId: course.teacher.id,
      studentId: student.id,
      courseId: course.id,
      amount: Number(paidAmount ?? course.price),
      status: 'COMPLETED',
      description: `Enrollment: ${course.title}`,
    },
  })

  return res.status(201).json({ success: true, enrollment })
}

export async function myEnrollments(req: AuthRequest, res: Response) {
  const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!student) return res.json({ success: true, enrollments: [] })

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id },
    include: { course: { include: { teacher: { select: { displayName: true, avatar: true } } } } },
    orderBy: { enrolledAt: 'desc' },
  })
  return res.json({ success: true, enrollments })
}

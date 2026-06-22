import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function browseCourses(req: Request, res: Response) {
  const { level, search, page = '1', limit = '20' } = req.query as Record<string, string>
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
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
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' })

  const courses = await prisma.course.findMany({
    where: { teacherId: teacher.id },
    include: { _count: { select: { enrollments: true, sessions: true, assignments: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return res.json({ success: true, courses })
}

export async function createCourse(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' })

  const course = await prisma.course.create({ data: { ...req.body, teacherId: teacher.id } })
  return res.status(201).json({ success: true, course })
}

export async function updateCourse(req: AuthRequest, res: Response) {
  const course = await prisma.course.update({ where: { id: req.params.id }, data: req.body })
  return res.json({ success: true, course })
}

export async function deleteCourse(req: AuthRequest, res: Response) {
  await prisma.course.delete({ where: { id: req.params.id } })
  return res.json({ success: true, message: 'Course deleted' })
}

export async function enrollInCourse(req: AuthRequest, res: Response) {
  const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

  const exists = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: student.id, courseId: req.params.id } },
  })
  if (exists) return res.status(409).json({ success: false, message: 'Already enrolled' })

  const enrollment = await prisma.enrollment.create({
    data: { studentId: student.id, courseId: req.params.id },
  })
  return res.status(201).json({ success: true, enrollment })
}

export async function myEnrollments(req: AuthRequest, res: Response) {
  const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id },
    include: { course: { include: { teacher: { select: { displayName: true, avatar: true } } } } },
    orderBy: { enrolledAt: 'desc' },
  })
  return res.json({ success: true, enrollments })
}

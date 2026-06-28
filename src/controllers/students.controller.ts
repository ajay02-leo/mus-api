import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function listStudents(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) return res.json({ success: true, students: [], page: 1, total: 0 })

  const page = Number(req.query.page ?? 1)
  const limit = Number(req.query.limit ?? 20)

  const enrollments = await prisma.enrollment.findMany({
    where: { course: { teacherId: teacher.id }, status: 'ACTIVE' },
    include: {
      student: {
        include: {
          user: { select: { email: true } },
          submissions: { select: { score: true, status: true } },
          attendance: { select: { status: true } },
        },
      },
      course: { select: { id: true, title: true } },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { enrolledAt: 'desc' },
  })

  const LEVEL_NUM: Record<string, number> = { BEGINNER: 1, INTERMEDIATE: 3, ADVANCED: 4 }

  return res.json({
    success: true,
    students: enrollments.map(e => {
      const s = e.student
      const graded = s.submissions.filter(sub => sub.status === 'GRADED' && sub.score != null)
      const avgScore = graded.length > 0
        ? Math.round(graded.reduce((a, sub) => a + (sub.score ?? 0), 0) / graded.length)
        : null
      return {
        id: s.id,
        name: s.displayName,
        email: s.user.email,
        level: LEVEL_NUM[s.level] ?? 1,
        levelLabel: s.level,
        xp: s.xp,
        streak: s.streak,
        totalSessions: s.attendance.length,
        presentSessions: s.attendance.filter(a => a.status === 'PRESENT').length,
        avgScore,
        course: e.course,
        enrolledAt: e.enrolledAt,
      }
    }),
    page,
    total: enrollments.length,
  })
}

export async function getStudent(req: AuthRequest, res: Response) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { email: true, createdAt: true } },
      enrollments: { include: { course: true } },
      submissions: { include: { assignment: true } },
      attendance: { include: { session: true } },
    },
  })
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
  return res.json({ success: true, student })
}

export async function myStats(req: AuthRequest, res: Response) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId: req.user!.userId },
    include: {
      submissions: { select: { score: true, status: true } },
      attendance: { select: { status: true } },
      enrollments: { select: { status: true, course: { select: { title: true } } } },
    },
  })
  if (!student) {
    return res.json({ success: true, student: { xp: 0, streak: 0, level: 'BEGINNER', submissions: [], attendance: [], enrollments: [] }, avgScore: null, attendancePct: null, totalAssignments: 0 })
  }

  const graded = student.submissions.filter(s => s.status === 'GRADED' && s.score != null)
  const avgScore = graded.length > 0
    ? Math.round(graded.reduce((a, s) => a + (s.score ?? 0), 0) / graded.length)
    : null
  const presentCount = student.attendance.filter(a => a.status === 'PRESENT').length
  const attendancePct = student.attendance.length > 0
    ? Math.round((presentCount / student.attendance.length) * 100)
    : null

  return res.json({ success: true, student, avgScore, attendancePct, totalAssignments: student.submissions.length })
}

export async function updateMyProfile(req: AuthRequest, res: Response) {
  const { displayName, bio, avatar, level, ragas } = req.body
  const data: any = {}
  if (displayName !== undefined) data.displayName = displayName
  if (bio !== undefined) data.bio = bio
  if (avatar !== undefined) data.avatar = avatar
  if (level !== undefined) data.level = level
  if (ragas !== undefined) data.ragas = ragas

  const profile = await prisma.studentProfile.upsert({
    where: { userId: req.user!.userId },
    update: data,
    create: { userId: req.user!.userId, displayName: displayName ?? 'Student', ...data },
  })
  return res.json({ success: true, profile })
}

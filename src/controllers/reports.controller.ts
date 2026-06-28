import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function monthlyReport(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' })

  const { month, year } = req.query as { month?: string; year?: string }
  const now = new Date()
  const targetMonth = month ? Number(month) - 1 : now.getMonth()
  const targetYear  = year  ? Number(year)        : now.getFullYear()

  const start = new Date(targetYear, targetMonth, 1)
  const end   = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59)

  // Students enrolled in teacher's courses
  const enrollments = await prisma.enrollment.findMany({
    where: { course: { teacherId: teacher.id }, status: 'ACTIVE' },
    include: {
      student: {
        include: {
          submissions: {
            where: { submittedAt: { gte: start, lte: end } },
            select: { score: true, status: true },
          },
          attendance: {
            where: { session: { scheduledAt: { gte: start, lte: end } } },
            select: { status: true },
          },
        },
      },
    },
  })

  const report = enrollments.map(e => {
    const s = e.student
    const graded = s.submissions.filter(sub => sub.status === 'GRADED' && sub.score != null)
    const avgScore = graded.length > 0
      ? Math.round(graded.reduce((a, sub) => a + (sub.score ?? 0), 0) / graded.length)
      : null
    const presentCount = s.attendance.filter(a => a.status === 'PRESENT').length
    const totalSessions = s.attendance.length
    const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : null

    return {
      studentId: s.id,
      displayName: s.displayName,
      level: s.level,
      totalSessions,
      presentCount,
      attendancePct,
      assignmentsSubmitted: s.submissions.length,
      assignmentsGraded: graded.length,
      avgScore,
    }
  })

  return res.json({ success: true, month: targetMonth + 1, year: targetYear, report })
}

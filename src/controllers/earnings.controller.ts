import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function myEarnings(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' })

  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const earnings = await prisma.earning.findMany({
    where: { teacherId: teacher.id },
    orderBy: { createdAt: 'desc' },
  })

  // Build monthly breakdown for last 6 months
  const monthly: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleString('en', { month: 'short' })
    monthly[key] = 0
  }

  let totalCompleted = 0
  for (const e of earnings) {
    if (e.status === 'COMPLETED') {
      totalCompleted += e.amount
      const key = new Date(e.createdAt).toLocaleString('en', { month: 'short' })
      if (key in monthly) monthly[key] += e.amount
    }
  }

  // Sessions taught this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const sessionsTaught = await prisma.session.count({
    where: { teacherId: teacher.id, scheduledAt: { gte: startOfMonth }, status: 'COMPLETED' },
  })

  const monthlyArr = Object.entries(monthly).map(([month, amount]) => ({ month, amount }))
  const recent = earnings.slice(0, 20).map(e => ({
    id: e.id,
    amount: e.amount,
    status: e.status,
    description: e.description,
    studentId: e.studentId,
    createdAt: e.createdAt,
  }))

  return res.json({
    success: true,
    total: totalCompleted,
    monthly: monthlyArr,
    recent,
    sessionsTaught,
  })
}

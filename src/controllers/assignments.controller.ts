import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function listAssignments(req: AuthRequest, res: Response) {
  const { userId, role } = req.user!

  if (role === 'TEACHER') {
    const teacher = await prisma.teacherProfile.findUnique({ where: { userId } })
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' })

    const assignments = await prisma.assignment.findMany({
      where: { teacherId: teacher.id },
      include: { submissions: { select: { status: true, score: true } }, course: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return res.json({ success: true, assignments })
  }

  const student = await prisma.studentProfile.findUnique({ where: { userId } })
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id, status: 'ACTIVE' },
    select: { courseId: true },
  })
  const assignments = await prisma.assignment.findMany({
    where: { courseId: { in: enrollments.map(e => e.courseId) } },
    include: {
      submissions: { where: { studentId: student.id } },
      teacher: { select: { displayName: true } },
    },
    orderBy: { dueDate: 'asc' },
  })
  return res.json({ success: true, assignments: assignments.map(a => ({ ...a, mySubmission: a.submissions[0] ?? null })) })
}

export async function getAssignment(req: AuthRequest, res: Response) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: req.params.id },
    include: {
      submissions: { include: { student: { include: { user: { select: { email: true } } } } } },
      teacher: { select: { displayName: true } },
    },
  })
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' })
  return res.json({ success: true, assignment })
}

export async function createAssignment(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' })

  const assignment = await prisma.assignment.create({
    data: {
      ...req.body,
      teacherId: teacher.id,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
    },
  })
  return res.status(201).json({ success: true, assignment })
}

export async function deleteAssignment(req: AuthRequest, res: Response) {
  await prisma.assignment.delete({ where: { id: req.params.id } })
  return res.json({ success: true, message: 'Assignment deleted' })
}

export async function submitAssignment(req: AuthRequest, res: Response) {
  const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId: req.params.id, studentId: student.id } },
    create: { assignmentId: req.params.id, studentId: student.id, ...req.body, status: 'SUBMITTED' },
    update: { ...req.body, status: 'SUBMITTED', submittedAt: new Date() },
  })
  return res.json({ success: true, submission })
}

export async function gradeSubmission(req: AuthRequest, res: Response) {
  const { submissionId, score, feedback } = req.body
  const submission = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: { status: 'GRADED', score, feedback, gradedAt: new Date() },
  })
  return res.json({ success: true, submission })
}

export async function reviewQueue(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' })

  const submissions = await prisma.assignmentSubmission.findMany({
    where: {
      status: 'SUBMITTED',
      assignment: { teacherId: teacher.id },
    },
    include: {
      assignment: { select: { id: true, title: true, type: true, raga: true } },
      student: {
        select: {
          displayName: true,
          user: { select: { email: true } },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  })

  return res.json({ success: true, submissions })
}

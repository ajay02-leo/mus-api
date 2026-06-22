import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'

export async function listResources(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' })
  const resources = await prisma.resource.findMany({ where: { teacherId: teacher.id }, orderBy: { createdAt: 'desc' } })
  return res.json({ success: true, resources })
}

export async function createResource(req: AuthRequest, res: Response) {
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' })
  const resource = await prisma.resource.create({ data: { ...req.body, teacherId: teacher.id } })
  return res.status(201).json({ success: true, resource })
}

export async function shareResource(req: AuthRequest, res: Response) {
  const { studentIds } = req.body
  const resource = await prisma.resource.update({
    where: { id: req.params.id },
    data: { sharedWith: { push: studentIds } },
  })
  return res.json({ success: true, resource })
}

export async function deleteResource(req: AuthRequest, res: Response) {
  await prisma.resource.delete({ where: { id: req.params.id } })
  return res.json({ success: true, message: 'Resource deleted' })
}

export async function myResources(req: AuthRequest, res: Response) {
  const student = await prisma.studentProfile.findUnique({ where: { userId: req.user!.userId } })
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
  const resources = await prisma.resource.findMany({
    where: { sharedWith: { has: student.id } },
    include: { teacher: { select: { displayName: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return res.json({ success: true, resources })
}

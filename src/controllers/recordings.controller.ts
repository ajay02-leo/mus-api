import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.API_URL ?? 'http://localhost:4000'

export async function uploadRecording(req: AuthRequest, res: Response) {
  if (!req.file) return res.status(400).json({ success: false, message: 'No audio file provided' })

  const { type = 'PRACTICE', raga, duration, notes } = req.body
  const fileUrl = `${BASE_URL}/uploads/recordings/${req.file.filename}`

  const recording = await prisma.recording.create({
    data: {
      userId: req.user!.userId,
      url: fileUrl,
      duration: duration ? Number(duration) : null,
      type: type as any,
      raga: raga ?? null,
    },
  })

  return res.status(201).json({
    success: true,
    recording,
    fileSizeBytes: req.file.size,
    filename: req.file.filename,
  })
}

export async function listMyRecordings(req: AuthRequest, res: Response) {
  const { type, raga, page = '1', limit = '20' } = req.query as Record<string, string>

  const recordings = await prisma.recording.findMany({
    where: {
      userId: req.user!.userId,
      ...(type ? { type: type as any } : {}),
      ...(raga ? { raga: { contains: raga, mode: 'insensitive' } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  })

  return res.json({ success: true, recordings, total: recordings.length })
}

export async function getRecording(req: AuthRequest, res: Response) {
  const recording = await prisma.recording.findUnique({ where: { id: req.params.id } })
  if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' })
  if (recording.userId !== req.user!.userId && req.user!.role !== 'TEACHER' && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }
  return res.json({ success: true, recording })
}

export async function deleteRecording(req: AuthRequest, res: Response) {
  const recording = await prisma.recording.findUnique({ where: { id: req.params.id } })
  if (!recording) return res.status(404).json({ success: false, message: 'Recording not found' })
  if (recording.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' })
  }

  // Delete file from disk
  const filename = recording.url.split('/').pop()
  if (filename) {
    const filePath = path.join(process.cwd(), 'uploads', 'recordings', filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  await prisma.recording.delete({ where: { id: req.params.id } })
  return res.json({ success: true, message: 'Recording deleted' })
}

// Teacher views a student's recordings (for grading assignment submissions)
export async function studentRecordings(req: AuthRequest, res: Response) {
  const recordings = await prisma.recording.findMany({
    where: { userId: req.params.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return res.json({ success: true, recordings })
}

// Admin — storage stats
export async function storageStats(_req: AuthRequest, res: Response) {
  const [total, byType] = await Promise.all([
    prisma.recording.count(),
    prisma.recording.groupBy({ by: ['type'], _count: { id: true } }),
  ])

  const uploadsDir = path.join(process.cwd(), 'uploads', 'recordings')
  let diskBytes = 0
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir)
    for (const f of files) {
      try { diskBytes += fs.statSync(path.join(uploadsDir, f)).size } catch {}
    }
  }

  return res.json({
    success: true,
    stats: {
      totalRecordings: total,
      diskUsageMB: (diskBytes / 1024 / 1024).toFixed(2),
      byType: byType.map(r => ({ type: r.type, count: r._count.id })),
    },
  })
}

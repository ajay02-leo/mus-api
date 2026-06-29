import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth'
import fs from 'fs'
import path from 'path'
import { compressAudio, getAudioDuration } from '../lib/upload'
import { awardXp } from './gamification.controller'

const BASE_URL = process.env.API_URL ?? 'http://localhost:4000'

export async function uploadRecording(req: AuthRequest, res: Response) {
  if (!req.file) return res.status(400).json({ success: false, message: 'No audio file provided' })

  const { type = 'PRACTICE', raga, title } = req.body
  const rawUrl = `${BASE_URL}/uploads/recordings/${req.file.filename}`
  const baseName = path.parse(req.file.filename).name

  // Get duration before responding
  const filePath = req.file.path
  const duration = await getAudioDuration(filePath)

  // Create DB record immediately so UI gets a response fast
  const recording = await prisma.recording.create({
    data: {
      userId:    req.user!.userId,
      title:     title ?? null,
      url:       rawUrl,
      duration,
      sizeBytes: req.file.size,
      type:      type as any,
      raga:      raga ?? null,
    },
  })

  // Fire-and-forget compression — don't block the response
  compressAudio(filePath, baseName).then(async (compressedUrl) => {
    if (compressedUrl) {
      await prisma.recording.update({
        where: { id: recording.id },
        data: { compressedUrl: `${BASE_URL}${compressedUrl}` },
      })
    }
  })

  // Award XP for uploading a practice recording
  if (type === 'PRACTICE' || type === 'ASSIGNMENT') {
    awardXp(req.user!.userId, 15, `Recording uploaded: ${title || type}`).catch(() => {})
  }

  // Update student's lastPracticed + totalPracticeMin if student
  if (req.user!.role === 'STUDENT' && duration) {
    await prisma.studentProfile.updateMany({
      where: { userId: req.user!.userId },
      data: {
        lastPracticed: new Date(),
        totalPracticeMin: { increment: Math.round(duration / 60) },
      },
    })
  }

  return res.status(201).json({ success: true, recording })
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

  const total = await prisma.recording.count({ where: { userId: req.user!.userId } })
  return res.json({ success: true, recordings, total })
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

  // Delete raw file from disk
  const rawFile = recording.url.split('/uploads/recordings/').pop()
  if (rawFile) {
    const p = path.join(process.cwd(), 'uploads', 'recordings', rawFile)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  }

  // Delete compressed file from disk
  if (recording.compressedUrl) {
    const compFile = recording.compressedUrl.split('/uploads/compressed/').pop()
    if (compFile) {
      const p = path.join(process.cwd(), 'uploads', 'compressed', compFile)
      if (fs.existsSync(p)) fs.unlinkSync(p)
    }
  }

  await prisma.recording.delete({ where: { id: req.params.id } })
  return res.json({ success: true })
}

export async function studentRecordings(req: AuthRequest, res: Response) {
  const recordings = await prisma.recording.findMany({
    where: { userId: req.params.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return res.json({ success: true, recordings })
}

export async function storageStats(_req: AuthRequest, res: Response) {
  const [total, byType] = await Promise.all([
    prisma.recording.count(),
    prisma.recording.groupBy({ by: ['type'], _count: { id: true } }),
  ])

  let diskBytes = 0
  for (const dir of ['recordings', 'compressed']) {
    const d = path.join(process.cwd(), 'uploads', dir)
    if (fs.existsSync(d)) {
      for (const f of fs.readdirSync(d)) {
        try { diskBytes += fs.statSync(path.join(d, f)).size } catch {}
      }
    }
  }

  const dbTotalBytes = await prisma.recording.aggregate({ _sum: { sizeBytes: true } })

  return res.json({
    success: true,
    stats: {
      totalRecordings: total,
      diskUsageMB: (diskBytes / 1024 / 1024).toFixed(2),
      dbReportedMB: ((dbTotalBytes._sum.sizeBytes ?? 0) / 1024 / 1024).toFixed(2),
      byType: byType.map(r => ({ type: r.type, count: r._count.id })),
    },
  })
}

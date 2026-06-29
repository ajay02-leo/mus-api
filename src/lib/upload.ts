import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'recordings')
const COMPRESSED_DIR = path.join(process.cwd(), 'uploads', 'compressed')

if (!fs.existsSync(UPLOAD_DIR))   fs.mkdirSync(UPLOAD_DIR,   { recursive: true })
if (!fs.existsSync(COMPRESSED_DIR)) fs.mkdirSync(COMPRESSED_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uid = crypto.randomBytes(12).toString('hex')
    const ext = path.extname(file.originalname).toLowerCase() || '.webm'
    cb(null, `${Date.now()}-${uid}${ext}`)
  },
})

const ALLOWED_TYPES = [
  'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/mp3',
  'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac',
  'audio/x-m4a', 'video/webm',
]

export const audioUpload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true)
    cb(new Error(`Unsupported file type: ${file.mimetype}`))
  },
})

export const UPLOADS_BASE_URL = '/uploads/recordings'
export const COMPRESSED_BASE_URL = '/uploads/compressed'

/**
 * Compress audio to 128kbps mono MP3.
 * Returns the compressed file path (relative URL) or null on failure.
 * Runs async — caller does not need to await it for the upload response.
 */
export function compressAudio(inputPath: string, baseName: string): Promise<string | null> {
  const outputFile = `${baseName}.mp3`
  const outputPath = path.join(COMPRESSED_DIR, outputFile)

  return new Promise((resolve) => {
    ffmpeg(inputPath)
      .audioChannels(1)          // mono
      .audioBitrate('128k')
      .audioFrequency(44100)
      .toFormat('mp3')
      .on('end', () => resolve(`/uploads/compressed/${outputFile}`))
      .on('error', (err) => {
        console.error('[ffmpeg] compression failed:', err.message)
        resolve(null)
      })
      .save(outputPath)
  })
}

/** Get duration of an audio file in seconds using ffprobe */
export function getAudioDuration(filePath: string): Promise<number | null> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve(null)
      resolve(Math.round(metadata.format.duration ?? 0))
    })
  })
}

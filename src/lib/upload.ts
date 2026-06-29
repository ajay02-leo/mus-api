import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'recordings')

// Ensure directory exists on startup
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uid  = crypto.randomBytes(12).toString('hex')
    const ext  = path.extname(file.originalname).toLowerCase() || '.webm'
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
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true)
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: mp3, wav, webm, ogg, flac, aac, m4a`))
  },
})

export const UPLOADS_BASE_URL = '/uploads/recordings'

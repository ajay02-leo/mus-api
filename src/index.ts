import 'dotenv/config'
import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'

const app  = express()
const PORT = Number(process.env.PORT ?? 4000)

// ─── Swagger / OpenAPI ────────────────────────────────────────────────────────

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SwaraSangam API',
      version: '1.0.0',
      description: `
## SwaraSangam REST API

Production API for the SwaraSangam Carnatic music learning platform.

### Authentication
Most endpoints require a **JWT bearer token**. Obtain one via \`POST /api/auth/login\`.

- **Web clients**: token is also set as an httpOnly cookie automatically.
- **Mobile clients**: use the \`Authorization: Bearer <token>\` header.

### Roles
| Role    | Access |
|---------|--------|
| STUDENT | Enroll in courses, submit assignments, view sessions |
| TEACHER | Manage students, courses, sessions, assignments, resources, reports |
| ADMIN   | Full access |
      `,
      contact: { name: 'SwaraSangam Team', email: 'ganakamalatechnology@gmail.com' },
    },
    servers: [
      { url: `http://localhost:${PORT}/api`, description: 'Local development' },
      { url: 'https://api.swarasangam.com/api', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Auth',          description: 'Registration, login, password management' },
      { name: 'Students',      description: 'Student profiles and stats' },
      { name: 'Sessions',      description: 'Class scheduling and attendance' },
      { name: 'Assignments',   description: 'Assignment creation, submission, grading' },
      { name: 'Courses',       description: 'Course management and enrollment' },
      { name: 'Resources',     description: 'Resource library (PDFs, audio, links)' },
      { name: 'Reports',       description: 'Monthly progress reports' },
      { name: 'Notifications', description: 'In-app notifications' },
    ],
  },
  apis: ['./src/routes/*.ts'],
})

// ─── Core middleware ──────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  process.env.WEB_URL ?? 'http://localhost:3001',
  'http://localhost:3001',
]

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (curl, mobile apps, Swagger)
    if (!origin) return callback(null, true)
    // allow any LAN IP on port 3001 (phone on same Wi-Fi)
    if (ALLOWED_ORIGINS.includes(origin) || /^http:\/\/192\.168\.\d+\.\d+:3001$/.test(origin) || /^http:\/\/10\.\d+\.\d+\.\d+:3001$/.test(origin)) {
      return callback(null, true)
    }
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Swagger UI ──────────────────────────────────────────────────────────────

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'SwaraSangam API Docs',
  customCss: '.swagger-ui .topbar { background: #7c401a; }',
  swaggerOptions: { persistAuthorization: true },
}))

app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec))

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }))

// ─── Static file serving — audio uploads ─────────────────────────────────────
// Files are served at /uploads/recordings/:filename
// Only authenticated users should access recordings; for now served openly
// (add signed-URL middleware here before production)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp3') || filePath.endsWith('.webm') || filePath.endsWith('.ogg')) {
      res.setHeader('Accept-Ranges', 'bytes')
      res.setHeader('Cache-Control', 'public, max-age=86400')
    }
  },
}))

// ─── API routes ───────────────────────────────────────────────────────────────

app.use('/api', routes)

// ─── Error handler ────────────────────────────────────────────────────────────

app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  const { networkInterfaces } = require('os')
  const nets = networkInterfaces()
  // Prefer Wi-Fi / Ethernet; skip virtual adapters (VMware, vEthernet, Loopback)
  const allLan: string[] = (Object.entries(nets) as [string, any[]][])
    .filter(([name]) => !/vmware|vethernet|loopback|vmnet/i.test(name))
    .flatMap(([, addrs]) => addrs)
    .filter((n: any) => n.family === 'IPv4' && !n.internal)
    .map((n: any) => n.address)
  const lanIp = allLan[0] ?? 'your-lan-ip'
  console.log(`\n  SwaraSangam API`)
  console.log(`  ┌─────────────────────────────────────────────────┐`)
  console.log(`  │  Local:   http://localhost:${PORT}                 │`)
  console.log(`  │  Network: http://${lanIp}:${PORT}           │`)
  console.log(`  │  Swagger: http://localhost:${PORT}/api/docs        │`)
  console.log(`  └─────────────────────────────────────────────────┘\n`)
})

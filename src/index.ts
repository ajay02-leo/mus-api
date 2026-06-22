import 'dotenv/config'
import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
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

app.use(cors({
  origin: process.env.WEB_URL ?? 'http://localhost:3001',
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

// ─── API routes ───────────────────────────────────────────────────────────────

app.use('/api', routes)

// ─── Error handler ────────────────────────────────────────────────────────────

app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  SwaraSangam API`)
  console.log(`  ┌───────────────────────────────────────────┐`)
  console.log(`  │  Server:  http://localhost:${PORT}           │`)
  console.log(`  │  Swagger: http://localhost:${PORT}/api/docs  │`)
  console.log(`  │  Health:  http://localhost:${PORT}/health    │`)
  console.log(`  └───────────────────────────────────────────┘\n`)
})

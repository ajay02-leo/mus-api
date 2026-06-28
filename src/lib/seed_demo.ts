import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const teacher = await prisma.user.findUnique({ where: { email: 'demo-teacher@swara.test' }, include: { teacher: true } })
  const student = await prisma.user.findUnique({ where: { email: 'demo-student@swara.test' }, include: { student: true } })
  const teacher2 = await prisma.user.findUnique({ where: { email: 'teacher2@swara.test' }, include: { teacher: true } })

  if (!teacher?.teacher) { console.log('Teacher profile missing!'); return }
  if (!student?.student) { console.log('Student profile missing!'); return }

  const tp = teacher.teacher
  const sp = student.student

  // Courses for demo teacher
  const existingCourses = await prisma.course.findMany({ where: { teacherId: tp.id } })
  let c1id: string
  if (existingCourses.length === 0) {
    const c1 = await prisma.course.create({ data: { teacherId: tp.id, title: 'Carnatic Vocal Foundations', description: 'Master the fundamentals — Sarali Varisai, svaras, gamakas.', level: 'BEGINNER', ragas: ['Mayamalavagowla', 'Mohanam'], price: 4999, isPublished: true } })
    await prisma.course.create({ data: { teacherId: tp.id, title: 'Shankarabharanam Mastery', description: 'Deep dive into the king of ragas.', level: 'INTERMEDIATE', ragas: ['Shankarabharanam'], price: 7999, isPublished: true } })
    await prisma.course.create({ data: { teacherId: tp.id, title: 'Kalpanaswara & Improvisation', description: 'Learn spontaneous improvisation.', level: 'ADVANCED', ragas: ['Multiple'], price: 11999, isPublished: true } })
    c1id = c1.id
    console.log('Created 3 courses for demo teacher')
  } else {
    c1id = existingCourses[0].id
    console.log(`Demo teacher has ${existingCourses.length} courses (id: ${c1id})`)
  }

  // Courses for teacher2
  if (teacher2?.teacher) {
    const t2c = await prisma.course.findMany({ where: { teacherId: teacher2.teacher.id } })
    if (t2c.length === 0) {
      await prisma.course.create({ data: { teacherId: teacher2.teacher.id, title: 'Bhajan & Devotional Music', description: 'Devotional music with Tamil and Sanskrit compositions.', level: 'BEGINNER', ragas: ['Multiple'], price: 2999, isPublished: true } })
      await prisma.course.create({ data: { teacherId: teacher2.teacher.id, title: 'Raga Todi Exploration', description: 'Advanced study of Todi.', level: 'ADVANCED', ragas: ['Todi'], price: 9999, isPublished: true } })
      console.log('Created 2 courses for teacher2')
    }
  }

  // Enroll student
  await prisma.enrollment.upsert({ where: { studentId_courseId: { studentId: sp.id, courseId: c1id } }, create: { studentId: sp.id, courseId: c1id, status: 'ACTIVE' }, update: {} })
  console.log('Student enrolled in demo course')

  // Sessions
  const existingSessions = await prisma.session.findMany({ where: { teacherId: tp.id } })
  if (existingSessions.length === 0) {
    const s1 = await prisma.session.create({ data: { teacherId: tp.id, courseId: c1id, title: 'Kalyani Alapana Session 1', scheduledAt: new Date('2026-07-02T10:00:00+05:30'), duration: 60, type: 'ONE_ON_ONE', status: 'SCHEDULED', meetingUrl: 'https://meet.google.com/swara-class-001' } })
    await prisma.session.create({ data: { teacherId: tp.id, courseId: c1id, title: 'Sarali Varisai Practice', scheduledAt: new Date('2026-07-09T10:00:00+05:30'), duration: 60, type: 'ONE_ON_ONE', status: 'SCHEDULED', meetingUrl: 'https://meet.google.com/swara-class-002' } })
    const past1 = await prisma.session.create({ data: { teacherId: tp.id, courseId: c1id, title: 'Mohanam Introduction', scheduledAt: new Date('2026-06-10T10:00:00+05:30'), duration: 60, type: 'ONE_ON_ONE', status: 'COMPLETED' } })
    const past2 = await prisma.session.create({ data: { teacherId: tp.id, courseId: c1id, title: 'Mayamalavagowla Varnam', scheduledAt: new Date('2026-05-25T10:00:00+05:30'), duration: 60, type: 'ONE_ON_ONE', status: 'COMPLETED' } })
    for (const sess of [past1, past2]) {
      await prisma.attendance.upsert({ where: { sessionId_studentId: { sessionId: sess.id, studentId: sp.id } }, create: { sessionId: sess.id, studentId: sp.id, status: 'PRESENT' }, update: {} })
    }
    console.log('Created 4 sessions with attendance')
  } else {
    console.log(`Demo teacher already has ${existingSessions.length} sessions`)
  }

  // Assignments
  const existingAssignments = await prisma.assignment.findMany({ where: { teacherId: tp.id } })
  if (existingAssignments.length === 0) {
    const a1 = await prisma.assignment.create({ data: { teacherId: tp.id, courseId: c1id, title: 'Sarali Varisai — 3 Full Sets', description: 'Practice Sarali Varisai in Mayamalavagowla. Record 3 complete sets. Focus on sruti.', type: 'PRACTICE', raga: 'Mayamalavagowla', dueDate: new Date('2026-07-10') } })
    const a2 = await prisma.assignment.create({ data: { teacherId: tp.id, courseId: c1id, title: 'Jantai Varisai — Speed Exercise', description: 'Practice at 3 speeds: slow, medium, fast.', type: 'PRACTICE', raga: 'Mayamalavagowla', dueDate: new Date('2026-07-20') } })
    await prisma.assignmentSubmission.upsert({ where: { assignmentId_studentId: { assignmentId: a1.id, studentId: sp.id } }, create: { assignmentId: a1.id, studentId: sp.id, notes: 'Practiced for 2 weeks.', status: 'GRADED', score: 8, feedback: 'Excellent sruti alignment. Work on Dha to Ni transition.', submittedAt: new Date('2026-06-18'), gradedAt: new Date('2026-06-20') }, update: {} })
    await prisma.assignmentSubmission.upsert({ where: { assignmentId_studentId: { assignmentId: a2.id, studentId: sp.id } }, create: { assignmentId: a2.id, studentId: sp.id, notes: 'Medium speed done. Fast is challenging.', status: 'SUBMITTED', submittedAt: new Date('2026-06-22') }, update: {} })
    console.log('Created 2 assignments (1 graded, 1 pending)')
  } else {
    console.log(`Demo teacher already has ${existingAssignments.length} assignments`)
  }

  console.log('\nDemo data ready!')
}
main().catch(console.error).finally(() => prisma.$disconnect())

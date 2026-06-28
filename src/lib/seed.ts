import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPw(pw: string) {
  return bcrypt.hash(pw, 10)
}

async function main() {
  console.log('🌱 Starting full seed...')

  // ── 1. Demo accounts ──────────────────────────────────────────────────────
  // Teacher: demo-teacher@swara.test / Demo1234!
  let teacher = await prisma.user.findUnique({ where: { email: 'demo-teacher@swara.test' }, include: { teacher: true } })
  if (!teacher) {
    teacher = await prisma.user.create({
      data: {
        email: 'demo-teacher@swara.test',
        password: await hashPw('Demo1234!'),
        role: 'TEACHER',
        teacher: { create: {
          displayName: 'Sri Venkat Raman',
          bio: 'Senior Carnatic vocalist with 20+ years teaching experience. Disciple of the Mysore gharana.',
          specialization: ['Vocal', 'Theory', 'Gamakas'],
          hourlyRate: 1200,
          rating: 4.9,
          totalRatings: 87,
          isVerified: true,
        }},
      },
      include: { teacher: true },
    })
    console.log('✓ Demo teacher: demo-teacher@swara.test / Demo1234!')
  } else {
    console.log('  Teacher already exists')
  }
  const teacherProfile = teacher.teacher!

  // Student: demo-student@swara.test / Demo1234!
  let student = await prisma.user.findUnique({ where: { email: 'demo-student@swara.test' }, include: { student: true } })
  if (!student) {
    student = await prisma.user.create({
      data: {
        email: 'demo-student@swara.test',
        password: await hashPw('Demo1234!'),
        role: 'STUDENT',
        student: { create: {
          displayName: 'Arjun Kumar',
          bio: 'Passionate about Carnatic music. Learning vocal for 2 years.',
          level: 'BEGINNER',
          xp: 350,
          streak: 7,
          ragas: ['Mayamalavagowla', 'Mohanam'],
        }},
      },
      include: { student: true },
    })
    console.log('✓ Demo student: demo-student@swara.test / Demo1234!')
  } else {
    console.log('  Student already exists')
  }
  const studentProfile = student.student!

  // Admin: admin@swara.test / Admin1234!
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@swara.test' } })
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: 'admin@swara.test',
        password: await hashPw('Admin1234!'),
        role: 'ADMIN',
      },
    })
    console.log('✓ Demo admin: admin@swara.test / Admin1234!')
  }

  // Extra teacher for marketplace variety
  let teacher2 = await prisma.user.findUnique({ where: { email: 'teacher2@swara.test' }, include: { teacher: true } })
  if (!teacher2) {
    teacher2 = await prisma.user.create({
      data: {
        email: 'teacher2@swara.test',
        password: await hashPw('Demo1234!'),
        role: 'TEACHER',
        teacher: { create: {
          displayName: 'Smt. Radha Krishnan',
          bio: 'Carnatic vocalist and veena player. 15 years of teaching experience.',
          specialization: ['Vocal', 'Veena'],
          hourlyRate: 1000,
          rating: 4.7,
          totalRatings: 62,
          isVerified: true,
        }},
      },
      include: { teacher: true },
    })
  }
  const teacherProfile2 = teacher2.teacher!

  // ── 2. Courses ──────────────────────────────────────────────────────────
  const courseCount = await prisma.course.count()
  let course1Id: string
  let course2Id: string
  let course3Id: string

  if (courseCount === 0) {
    const c1 = await prisma.course.create({ data: {
      teacherId: teacherProfile.id,
      title: 'Carnatic Vocal Foundations',
      description: 'Master the fundamentals of Carnatic music — Sarali Varisai, svaras, gamakas, and basic compositions in Mayamalavagowla.',
      level: 'BEGINNER',
      ragas: ['Mayamalavagowla', 'Mohanam', 'Hamsadhwani'],
      price: 4999,
      isPublished: true,
    }})
    course1Id = c1.id

    const c2 = await prisma.course.create({ data: {
      teacherId: teacherProfile.id,
      title: 'Shankarabharanam Mastery',
      description: 'Deep dive into the king of ragas. Varnams, Krithis, Neraval, and Kalpanaswara in Shankarabharanam.',
      level: 'INTERMEDIATE',
      ragas: ['Shankarabharanam'],
      price: 7999,
      isPublished: true,
    }})
    course2Id = c2.id

    const c3 = await prisma.course.create({ data: {
      teacherId: teacherProfile2.id,
      title: 'Bhajan & Devotional Music',
      description: 'A gentle introduction to devotional music with Tamil and Sanskrit compositions. Perfect for beginners.',
      level: 'BEGINNER',
      ragas: ['Multiple'],
      price: 2999,
      isPublished: true,
    }})
    course3Id = c3.id

    await prisma.course.create({ data: {
      teacherId: teacherProfile2.id,
      title: 'Raga Todi Exploration',
      description: 'Advanced study of Todi — one of the most complex and emotive ragas in the Carnatic canon.',
      level: 'ADVANCED',
      ragas: ['Todi'],
      price: 9999,
      isPublished: true,
    }})

    await prisma.course.create({ data: {
      teacherId: teacherProfile.id,
      title: 'Kalpanaswara & Improvisation',
      description: 'Learn the art of spontaneous improvisation within the grammar of a raga.',
      level: 'ADVANCED',
      ragas: ['Multiple'],
      price: 11999,
      isPublished: true,
    }})

    console.log('✓ 5 courses seeded')
  } else {
    console.log(`  Courses already seeded (${courseCount} found)`)
    const existingCourses = await prisma.course.findMany({ where: { teacherId: teacherProfile.id }, take: 2 })
    course1Id = existingCourses[0]?.id ?? ''
    course2Id = existingCourses[1]?.id ?? existingCourses[0]?.id ?? ''
    const c3 = await prisma.course.findFirst({ where: { teacherId: teacherProfile2.id } })
    course3Id = c3?.id ?? ''
  }

  // ── 3. Enroll demo student ───────────────────────────────────────────────
  if (course1Id) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: studentProfile.id, courseId: course1Id } },
      create: { studentId: studentProfile.id, courseId: course1Id, status: 'ACTIVE' },
      update: {},
    })
    console.log('✓ Student enrolled in course 1')
  }

  // ── 4. Sessions ──────────────────────────────────────────────────────────
  const sessionCount = await prisma.session.count()
  let sessionId: string = ''
  if (sessionCount === 0) {
    const s1 = await prisma.session.create({ data: {
      teacherId: teacherProfile.id,
      courseId: course1Id,
      title: 'Kalyani Alapana — Session 1',
      scheduledAt: new Date('2026-07-02T10:00:00+05:30'),
      duration: 60,
      type: 'ONE_ON_ONE',
      status: 'SCHEDULED',
      meetingUrl: 'https://meet.google.com/swara-class-001',
    }})
    sessionId = s1.id

    await prisma.session.create({ data: {
      teacherId: teacherProfile.id,
      courseId: course1Id,
      title: 'Sarali Varisai Practice',
      scheduledAt: new Date('2026-07-09T10:00:00+05:30'),
      duration: 60,
      type: 'ONE_ON_ONE',
      status: 'SCHEDULED',
      meetingUrl: 'https://meet.google.com/swara-class-002',
    }})

    await prisma.session.create({ data: {
      teacherId: teacherProfile.id,
      courseId: course1Id,
      title: 'Mohanam Introduction',
      scheduledAt: new Date('2026-06-10T10:00:00+05:30'),
      duration: 60,
      type: 'ONE_ON_ONE',
      status: 'COMPLETED',
    }})

    await prisma.session.create({ data: {
      teacherId: teacherProfile.id,
      courseId: course1Id,
      title: 'Mayamalavagowla Varnam',
      scheduledAt: new Date('2026-05-25T10:00:00+05:30'),
      duration: 60,
      type: 'ONE_ON_ONE',
      status: 'COMPLETED',
    }})

    // Attendance for completed sessions
    const completedSessions = await prisma.session.findMany({ where: { status: 'COMPLETED', teacherId: teacherProfile.id } })
    for (const sess of completedSessions) {
      await prisma.attendance.upsert({
        where: { sessionId_studentId: { sessionId: sess.id, studentId: studentProfile.id } },
        create: { sessionId: sess.id, studentId: studentProfile.id, status: 'PRESENT' },
        update: {},
      })
    }
    console.log('✓ 4 sessions seeded (2 upcoming, 2 completed with attendance)')
  } else {
    console.log(`  Sessions already seeded (${sessionCount} found)`)
    const existingSession = await prisma.session.findFirst({ where: { teacherId: teacherProfile.id, status: 'SCHEDULED' } })
    sessionId = existingSession?.id ?? ''
  }

  // ── 5. Assignments ───────────────────────────────────────────────────────
  const assignmentCount = await prisma.assignment.count()
  if (assignmentCount === 0) {
    const a1 = await prisma.assignment.create({ data: {
      teacherId: teacherProfile.id,
      courseId: course1Id,
      title: 'Sarali Varisai — 3 Full Sets',
      description: 'Practice Sarali Varisai in Mayamalavagowla. Record 3 complete ascending and descending sets. Focus on sruti alignment.',
      type: 'PRACTICE',
      raga: 'Mayamalavagowla',
      dueDate: new Date('2026-07-10'),
    }})

    const a2 = await prisma.assignment.create({ data: {
      teacherId: teacherProfile.id,
      courseId: course1Id,
      title: 'Jantai Varisai — Speed Exercise',
      description: 'Practice Jantai Varisai at 3 speeds: slow, medium, fast. Record yourself and note any rhythm issues.',
      type: 'PRACTICE',
      raga: 'Mayamalavagowla',
      dueDate: new Date('2026-07-20'),
    }})

    // Student submits a1, teacher grades it
    const sub1 = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId: a1.id, studentId: studentProfile.id } },
      create: {
        assignmentId: a1.id,
        studentId: studentProfile.id,
        notes: 'Practiced for 2 weeks. Struggled with the 5th varisai initially.',
        status: 'GRADED',
        score: 8,
        feedback: 'Excellent sruti alignment. Work on the transition from Dha to Ni in the upper octave.',
        submittedAt: new Date('2026-06-18'),
        gradedAt: new Date('2026-06-20'),
      },
      update: {},
    })

    // Student submits a2 (ungraded)
    await prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId: a2.id, studentId: studentProfile.id } },
      create: {
        assignmentId: a2.id,
        studentId: studentProfile.id,
        notes: 'Managed to reach medium speed. Fast is still challenging.',
        status: 'SUBMITTED',
        submittedAt: new Date('2026-06-22'),
      },
      update: {},
    })

    console.log('✓ 2 assignments seeded (1 graded, 1 pending review)')
  } else {
    console.log(`  Assignments already seeded (${assignmentCount} found)`)
  }

  // ── 6. Earnings for teacher ──────────────────────────────────────────────
  const earningCount = await prisma.earning.count()
  if (earningCount === 0) {
    const months = [1, 2, 3, 4, 5, 6].map(m => new Date(2026, m - 1, 15))
    const amounts = [8500, 12000, 9800, 15000, 11200, 14500]
    await Promise.all(months.map((date, i) => prisma.earning.create({ data: {
      teacherId: teacherProfile.id,
      amount: amounts[i],
      status: 'COMPLETED',
      description: `Monthly earnings — ${date.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`,
      createdAt: date,
    }})))
    console.log('✓ 6 months of earnings seeded')
  } else {
    console.log(`  Earnings already seeded (${earningCount} found)`)
  }

  // ── 7. Notifications ─────────────────────────────────────────────────────
  const notifCount = await prisma.notification.count({ where: { userId: student.id } })
  if (notifCount === 0) {
    await prisma.notification.createMany({ data: [
      { userId: student.id, type: 'assignment_graded', title: 'Assignment Graded', body: 'Your Sarali Varisai assignment has been graded: 8/10. Excellent work!' },
      { userId: student.id, type: 'session_reminder', title: 'Session Tomorrow', body: 'Reminder: You have a session "Kalyani Alapana" tomorrow at 10:00 AM.' },
      { userId: student.id, type: 'new_assignment', title: 'New Assignment', body: 'Your teacher has posted a new assignment: Jantai Varisai — Speed Exercise.' },
      { userId: teacher.id, type: 'submission_received', title: 'New Submission', body: 'Arjun Kumar submitted Jantai Varisai — Speed Exercise for review.' },
      { userId: teacher.id, type: 'new_enrollment', title: 'New Enrollment', body: 'Arjun Kumar enrolled in Carnatic Vocal Foundations.' },
    ]})
    console.log('✓ 5 notifications seeded')
  }

  // ── 8. Community posts ──────────────────────────────────────────────────
  const postCount = await prisma.post.count()
  if (postCount === 0) {
    const p1 = await prisma.post.create({ data: {
      authorId: student.id,
      category: 'Q&A',
      title: 'How long does it take to learn a new raga?',
      body: 'I have been learning Mayamalavagowla for 3 months now and my teacher says I am ready for Mohanam. How long did it take others to feel comfortable in a new raga?',
      tags: ['beginner', 'raga', 'practice-tips'],
      likedBy: [teacher.id],
    }})

    await prisma.comment.create({ data: {
      postId: p1.id,
      authorId: teacher.id,
      body: 'It depends on your practice consistency. For an intermediate student, expect 6-8 weeks of focused daily practice to feel comfortable in a new raga.',
    }})

    await prisma.post.create({ data: {
      authorId: teacher.id,
      category: 'Resources',
      title: 'Practice tip: Recording yourself is the fastest path to improvement',
      body: 'I always tell my students: record every session, listen back, and note 3 things you want to improve. Your ears will catch what your mind misses in the moment. Apps like GarageBand work perfectly for this.',
      tags: ['practice-tips', 'technique', 'teachers'],
      pinned: true,
      likedBy: [student.id],
    }})

    await prisma.post.create({ data: {
      authorId: student.id,
      category: 'Milestones',
      title: 'I just completed my first Varnam! 🎉',
      body: 'After 6 months of practice, I finally completed the full Viriboni Varnam in Bhairavi without stopping. My teacher gave me 8/10 — I am over the moon!',
      tags: ['milestone', 'varnam', 'bhairavi'],
      likedBy: [teacher.id, teacher2.id],
    }})

    console.log('✓ 3 community posts seeded')
  }

  // ── 9. Events ───────────────────────────────────────────────────────────
  const eventCount = await prisma.event.count()
  if (eventCount === 0) {
    await prisma.event.createMany({ data: [
      { title: 'Swara Sangam Annual Carnatic Concert', description: 'An evening of classical Carnatic music featuring star students and guru performances.', type: 'CONCERT', artists: ['Smt. Radha Krishnan', 'Sri Venkat Raman'], date: new Date('2026-07-15T18:30:00+05:30'), time: '6:30 PM IST', venue: 'Music Academy, Chennai', seats: 200, booked: 143, price: 500, tags: ['Carnatic Vocal', 'Veena'], isPublished: true },
      { title: 'Raga Immersion Weekend: Shankarabharanam', description: 'A 2-day deep dive workshop into Shankarabharanam.', type: 'WORKSHOP', artists: ['Sri Venkat Raman'], date: new Date('2026-07-26T10:00:00+05:30'), time: '10:00 AM IST', venue: 'Online (Zoom)', seats: 30, booked: 22, price: 1200, tags: ['Workshop', 'Online'], isPublished: true },
      { title: 'Student Showcase — Summer Arangetram', description: 'Celebrate the achievements of our students at the annual summer showcase.', type: 'SHOWCASE', artists: ['Students of Swara Sangam'], date: new Date('2026-08-10T17:00:00+05:30'), time: '5:00 PM IST', venue: 'Narada Gana Sabha, Chennai', seats: 150, booked: 78, price: 200, tags: ['Student', 'Family'], isPublished: true },
      { title: 'Masterclass: Kalpanaswara with Sri Anand Kumar', description: 'An intimate masterclass on spontaneous improvisation.', type: 'MASTERCLASS', artists: ['Sri Anand Kumar'], date: new Date('2026-08-22T19:00:00+05:30'), time: '7:00 PM IST', venue: 'Online (Zoom)', seats: 20, booked: 19, price: 800, tags: ['Masterclass', 'Advanced'], isPublished: true },
      { title: 'Thyagaraja Aradhana Celebration', description: 'Pancharatna Kritis sung in unison at dawn.', type: 'CONCERT', artists: ['All Swara Sangam Teachers'], date: new Date('2026-09-05T08:00:00+05:30'), time: '8:00 AM IST', venue: 'Sri Thyagaraja Temple, Thiruvaiyaru', seats: 500, booked: 201, price: 0, tags: ['Free', 'Devotional'], isPublished: true },
      { title: 'Introduction to Carnatic Music — Open Day', description: 'New to Carnatic music? Join our free open day.', type: 'WORKSHOP', artists: ['Smt. Radha Krishnan'], date: new Date('2026-09-14T11:00:00+05:30'), time: '11:00 AM IST', venue: 'Online (Zoom)', seats: 50, booked: 12, price: 0, tags: ['Free', 'Beginner'], isPublished: true },
    ]})
    console.log('✓ 6 events seeded')
  }

  console.log('\n🎉 Seed complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎓 Teacher:  demo-teacher@swara.test / Demo1234!')
  console.log('🎵 Student:  demo-student@swara.test / Demo1234!')
  console.log('🔑 Admin:    admin@swara.test / Admin1234!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

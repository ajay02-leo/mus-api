import { loginAs, TEACHER, STUDENT, ADMIN, CONTENT, UNAUTH } from './helpers'

// TC-054 to TC-075
describe('Admin', () => {
  it('TC-054 GET /admin/users without auth returns 401', async () => {
    const res = await UNAUTH.get('/api/admin/users')
    expect(res.status).toBe(401)
  })

  it('TC-055 GET /admin/users as STUDENT returns 403', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/admin/users')
    expect(res.status).toBe(403)
  })

  it('TC-056 GET /admin/users as TEACHER returns 403', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/admin/users')
    expect(res.status).toBe(403)
  })

  it('TC-057 GET /admin/users as ADMIN returns user list', async () => {
    const { agent } = await loginAs(ADMIN.email, ADMIN.password)
    const res = await agent.get('/api/admin/users')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.users)).toBe(true)
  })

  it('TC-058 GET /admin/users filter by role=TEACHER', async () => {
    const { agent } = await loginAs(ADMIN.email, ADMIN.password)
    const res = await agent.get('/api/admin/users?role=TEACHER')
    expect(res.status).toBe(200)
    res.body.users.forEach((u: any) => expect(u.role).toBe('TEACHER'))
  })

  it('TC-059 GET /admin/stats returns platform stats', async () => {
    const { agent } = await loginAs(ADMIN.email, ADMIN.password)
    const res = await agent.get('/api/admin/stats')
    expect(res.status).toBe(200)
    expect(res.body.stats).toBeDefined()
    expect(res.body.stats.totalStudents).toBeGreaterThanOrEqual(0)
  })

  it('TC-060 GET /admin/courses returns all courses with teacher info', async () => {
    const { agent } = await loginAs(ADMIN.email, ADMIN.password)
    const res = await agent.get('/api/admin/courses')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.courses)).toBe(true)
  })

  it('TC-061 GET /admin/courses?status=PENDING_REVIEW filters correctly', async () => {
    const { agent } = await loginAs(ADMIN.email, ADMIN.password)
    const res = await agent.get('/api/admin/courses?status=PENDING_REVIEW')
    res.body.courses.forEach((c: any) => expect(c.status).toBe('PENDING_REVIEW'))
  })

  it('TC-062 PATCH /admin/courses/:id/approve sets status to APPROVED', async () => {
    const { agent: teacherAgent } = await loginAs(TEACHER.email, TEACHER.password)
    const create = await teacherAgent.post('/api/courses').send({ title: `ApproveMe ${Date.now()}`, price: 0 })
    const courseId = create.body.course.id

    const { agent: adminAgent } = await loginAs(ADMIN.email, ADMIN.password)
    const res = await adminAgent.patch(`/api/admin/courses/${courseId}/approve`)
    expect(res.status).toBe(200)
    expect(res.body.course.status).toBe('APPROVED')
    expect(res.body.course.isPublished).toBe(true)
  })

  it('TC-063 PATCH /admin/courses/:id/reject sets status to REJECTED', async () => {
    const { agent: teacherAgent } = await loginAs(TEACHER.email, TEACHER.password)
    const create = await teacherAgent.post('/api/courses').send({ title: `RejectMe ${Date.now()}`, price: 0 })
    const courseId = create.body.course.id

    const { agent: adminAgent } = await loginAs(ADMIN.email, ADMIN.password)
    const res = await adminAgent.patch(`/api/admin/courses/${courseId}/reject`)
    expect(res.status).toBe(200)
    expect(res.body.course.status).toBe('REJECTED')
    expect(res.body.course.isPublished).toBe(false)
  })

  it('TC-064 GET /admin/payments returns payment list', async () => {
    const { agent } = await loginAs(ADMIN.email, ADMIN.password)
    const res = await agent.get('/api/admin/payments')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.payments)).toBe(true)
    expect(typeof res.body.total).toBe('number')
  })

  it('TC-065 GET /admin/teachers returns teacher list', async () => {
    const { agent } = await loginAs(ADMIN.email, ADMIN.password)
    const res = await agent.get('/api/admin/teachers')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.teachers)).toBe(true)
  })

  it('TC-066 PATCH /admin/teachers/:id/verify sets isVerified=true', async () => {
    const { agent } = await loginAs(ADMIN.email, ADMIN.password)
    const teachers = await agent.get('/api/admin/teachers')
    const t = teachers.body.teachers?.[0]
    if (!t) return
    const res = await agent.patch(`/api/admin/teachers/${t.id}/verify`)
    expect(res.status).toBe(200)
    expect(res.body.teacher.isVerified).toBe(true)
  })

  it('TC-067 PATCH /admin/teachers/:id/unverify sets isVerified=false', async () => {
    const { agent } = await loginAs(ADMIN.email, ADMIN.password)
    const teachers = await agent.get('/api/admin/teachers')
    const t = teachers.body.teachers?.[0]
    if (!t) return
    await agent.patch(`/api/admin/teachers/${t.id}/verify`)
    const res = await agent.patch(`/api/admin/teachers/${t.id}/unverify`)
    expect(res.status).toBe(200)
    expect(res.body.teacher.isVerified).toBe(false)
  })

  it('TC-068 PATCH /admin/users/:id/suspend as STUDENT returns 403', async () => {
    const { agent: adminAgent } = await loginAs(ADMIN.email, ADMIN.password)
    const users = await adminAgent.get('/api/admin/users?role=STUDENT')
    const target = users.body.users?.[0]
    if (!target) return

    const { agent: studentAgent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await studentAgent.patch(`/api/admin/users/${target.id}/suspend`)
    expect(res.status).toBe(403)
  })

  it('TC-069 CONTENT_MANAGER cannot access /admin/users', async () => {
    const { agent } = await loginAs(CONTENT.email, CONTENT.password)
    const res = await agent.get('/api/admin/users')
    expect(res.status).toBe(403)
  })

  it('TC-070 Monthly signups are included in stats response', async () => {
    const { agent } = await loginAs(ADMIN.email, ADMIN.password)
    const res = await agent.get('/api/admin/stats')
    expect(Array.isArray(res.body.monthlySignups)).toBe(true)
    expect(res.body.monthlySignups.length).toBeGreaterThan(0)
  })
})

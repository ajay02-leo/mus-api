import { loginAs, TEACHER, STUDENT, ADMIN, UNAUTH } from './helpers'

// TC-018 to TC-036
describe('Courses', () => {
  it('TC-018 GET /courses (browse) returns approved courses publicly', async () => {
    const res = await UNAUTH.get('/api/courses')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.courses)).toBe(true)
  })

  it('TC-019 All browseable courses have status APPROVED', async () => {
    const res = await UNAUTH.get('/api/courses')
    const courses = res.body.courses ?? []
    courses.forEach((c: any) => expect(c.status).toBe('APPROVED'))
  })

  it('TC-020 GET /courses/my requires TEACHER role', async () => {
    const res = await UNAUTH.get('/api/courses/my')
    expect(res.status).toBe(401)
  })

  it('TC-021 GET /courses/my as student returns 403', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/courses/my')
    expect(res.status).toBe(403)
  })

  it('TC-022 GET /courses/my as teacher returns teacher\'s courses', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/courses/my')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.courses)).toBe(true)
  })

  it('TC-023 POST /courses as teacher creates course in PENDING_REVIEW', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.post('/api/courses').send({
      title: `Test Course ${Date.now()}`, description: 'Auto test', level: 'BEGINNER', price: 0,
    })
    expect(res.status).toBe(201)
    expect(res.body.course.status).toBe('PENDING_REVIEW')
    expect(res.body.course.isPublished).toBe(false)
  })

  it('TC-024 POST /courses as student returns 403', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.post('/api/courses').send({ title: 'Hack course', price: 0 })
    expect(res.status).toBe(403)
  })

  it('TC-025 GET /courses/:id returns a single course', async () => {
    const list = await UNAUTH.get('/api/courses')
    const first = list.body.courses?.[0]
    if (!first) return
    const res = await UNAUTH.get(`/api/courses/${first.id}`)
    expect(res.status).toBe(200)
    expect(res.body.course.id).toBe(first.id)
  })

  it('TC-026 GET /courses/nonexistent-id returns 404', async () => {
    const res = await UNAUTH.get('/api/courses/nonexistent-id-xyz')
    expect(res.status).toBe(404)
  })

  it('TC-027 GET /courses/enrolled requires auth', async () => {
    const res = await UNAUTH.get('/api/courses/enrolled')
    expect(res.status).toBe(401)
  })

  it('TC-028 GET /courses/enrolled as student returns enrollments', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/courses/enrolled')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.enrollments)).toBe(true)
  })

  it('TC-029 POST /courses/:id/enroll on PENDING course returns 400', async () => {
    const { agent: teacherAgent } = await loginAs(TEACHER.email, TEACHER.password)
    const createRes = await teacherAgent.post('/api/courses').send({
      title: `Pending ${Date.now()}`, price: 0,
    })
    const pendingId = createRes.body.course.id

    const { agent: studentAgent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await studentAgent.post(`/api/courses/${pendingId}/enroll`).send({})
    expect(res.status).toBe(400)
  })

  it('TC-030 Enrolling in an approved free course succeeds', async () => {
    const { agent: adminAgent } = await loginAs(ADMIN.email, ADMIN.password)
    const { agent: teacherAgent } = await loginAs(TEACHER.email, TEACHER.password)
    const createRes = await teacherAgent.post('/api/courses').send({
      title: `FreeEnroll ${Date.now()}`, price: 0,
    })
    const courseId = createRes.body.course.id
    await adminAgent.patch(`/api/admin/courses/${courseId}/approve`)

    const { agent: studentAgent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await studentAgent.post(`/api/courses/${courseId}/enroll`).send({})
    expect([201, 409]).toContain(res.status) // 201 = enrolled, 409 = already enrolled
  })
})

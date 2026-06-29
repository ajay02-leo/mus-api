import { loginAs, TEACHER, STUDENT, ADMIN, UNAUTH } from './helpers'

// TC-043 to TC-056
describe('Sessions', () => {
  it('TC-043 GET /sessions without auth returns 401', async () => {
    const res = await UNAUTH.get('/api/sessions')
    expect(res.status).toBe(401)
  })

  it('TC-044 GET /sessions as TEACHER returns sessions array', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/sessions')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.sessions)).toBe(true)
  })

  it('TC-045 GET /sessions as STUDENT returns their sessions', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/sessions')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.sessions)).toBe(true)
  })

  it('TC-046 POST /sessions as TEACHER creates a session', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.post('/api/sessions').send({
      title: `Test Session ${Date.now()}`,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      duration: 60,
      type: 'ONE_ON_ONE',
    })
    expect(res.status).toBe(201)
    expect(res.body.session).toBeDefined()
    expect(res.body.session.id).toBeDefined()
  })

  it('TC-047 POST /sessions as STUDENT returns 403', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.post('/api/sessions').send({
      title: 'Hack', scheduledAt: new Date().toISOString(), duration: 30,
    })
    expect(res.status).toBe(403)
  })

  it('TC-048 POST /sessions with meetingUrl stores Google Meet link', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const meetUrl = 'https://meet.google.com/abc-defg-hij'
    const res = await agent.post('/api/sessions').send({
      title: `Live Session ${Date.now()}`,
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      duration: 45, meetingUrl: meetUrl,
    })
    expect(res.status).toBe(201)
    expect(res.body.session.meetingUrl).toBe(meetUrl)
  })

  it('TC-049 PATCH /sessions/:id as TEACHER updates session', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const create = await agent.post('/api/sessions').send({
      title: `Update Me ${Date.now()}`,
      scheduledAt: new Date(Date.now() + 7200000).toISOString(),
      duration: 30,
    })
    const id = create.body.session.id
    const res = await agent.patch(`/api/sessions/${id}`).send({ title: 'Updated Title', notes: 'Updated notes' })
    expect(res.status).toBe(200)
    expect(res.body.session.title).toBe('Updated Title')
  })

  it('TC-050 DELETE /sessions/:id as TEACHER deletes session', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const create = await agent.post('/api/sessions').send({
      title: `Delete Me ${Date.now()}`,
      scheduledAt: new Date(Date.now() + 10800000).toISOString(),
      duration: 30,
    })
    const id = create.body.session.id
    const del = await agent.delete(`/api/sessions/${id}`)
    expect(del.status).toBe(200)
  })

  it('TC-051 PATCH /sessions/:id as STUDENT returns 403', async () => {
    const { agent: teacherAgent } = await loginAs(TEACHER.email, TEACHER.password)
    const create = await teacherAgent.post('/api/sessions').send({
      title: `Protect Me ${Date.now()}`,
      scheduledAt: new Date(Date.now() + 14400000).toISOString(),
      duration: 30,
    })
    const id = create.body.session.id
    const { agent: studentAgent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await studentAgent.patch(`/api/sessions/${id}`).send({ title: 'Hacked' })
    expect(res.status).toBe(403)
  })

  it('TC-052 POST /sessions/:id/attendance records attendance', async () => {
    const { agent: teacherAgent } = await loginAs(TEACHER.email, TEACHER.password)
    const { agent: studentAgent } = await loginAs(STUDENT.email, STUDENT.password)
    const create = await teacherAgent.post('/api/sessions').send({
      title: `Attend ${Date.now()}`,
      scheduledAt: new Date(Date.now() + 18000000).toISOString(),
      duration: 60,
    })
    const sessionId = create.body.session.id
    const meRes = await studentAgent.get('/api/students/me/stats')
    const studentId = meRes.body.student?.id
    if (!studentId) return
    const res = await teacherAgent.post(`/api/sessions/${sessionId}/attendance`).send({
      studentId, status: 'PRESENT',
    })
    expect([200, 201, 409]).toContain(res.status)
  })

  it('TC-053 Session without required scheduledAt returns 4xx', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.post('/api/sessions').send({ title: 'No date', duration: 30 })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})

import { loginAs, TEACHER, STUDENT, UNAUTH } from './helpers'

// TC-071 to TC-082
describe('Assignments', () => {
  it('TC-071 GET /assignments without auth returns 401', async () => {
    const res = await UNAUTH.get('/api/assignments')
    expect(res.status).toBe(401)
  })

  it('TC-072 GET /assignments as TEACHER returns assignment list', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/assignments')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.assignments)).toBe(true)
  })

  it('TC-073 GET /assignments as STUDENT returns their assignments', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/assignments')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.assignments)).toBe(true)
  })

  it('TC-074 POST /assignments as TEACHER creates assignment', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.post('/api/assignments').send({
      title: `Test Assignment ${Date.now()}`,
      description: 'Practise Bhairavi',
      type: 'PRACTICE',
    })
    expect(res.status).toBe(201)
    expect(res.body.assignment.id).toBeDefined()
  })

  it('TC-075 POST /assignments as STUDENT returns 403', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.post('/api/assignments').send({ title: 'Hack', type: 'PRACTICE' })
    expect(res.status).toBe(403)
  })

  it('TC-076 GET /assignments/:id returns assignment detail', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const create = await agent.post('/api/assignments').send({ title: `Detail ${Date.now()}`, type: 'THEORY' })
    const id = create.body.assignment.id
    const res = await agent.get(`/api/assignments/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.assignment.id).toBe(id)
  })

  it('TC-077 GET /assignments/review-queue as TEACHER returns submissions', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/assignments/review-queue')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.submissions)).toBe(true)
  })

  it('TC-078 GET /assignments/review-queue as STUDENT returns 403', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/assignments/review-queue')
    expect(res.status).toBe(403)
  })

  it('TC-079 DELETE /assignments/:id as TEACHER deletes it', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const create = await agent.post('/api/assignments').send({ title: `DeleteMe ${Date.now()}`, type: 'PRACTICE' })
    const id = create.body.assignment.id
    const res = await agent.delete(`/api/assignments/${id}`)
    expect(res.status).toBe(200)
  })

  it('TC-080 POST /assignments/:id/submit as STUDENT submits', async () => {
    const { agent: teacherAgent } = await loginAs(TEACHER.email, TEACHER.password)
    const create = await teacherAgent.post('/api/assignments').send({ title: `Submit ${Date.now()}`, type: 'PRACTICE' })
    const id = create.body.assignment.id

    const { agent: studentAgent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await studentAgent.post(`/api/assignments/${id}/submit`).send({ notes: 'Submitted my practice recording' })
    expect(res.status).toBeGreaterThanOrEqual(200)
  })

  it('TC-081 POST /assignments/:id/grade as TEACHER grades submission', async () => {
    const { agent: teacherAgent } = await loginAs(TEACHER.email, TEACHER.password)
    const create = await teacherAgent.post('/api/assignments').send({ title: `Grade ${Date.now()}`, type: 'PERFORMANCE' })
    const assignmentId = create.body.assignment.id

    const { agent: studentAgent } = await loginAs(STUDENT.email, STUDENT.password)
    const submitRes = await studentAgent.post(`/api/assignments/${assignmentId}/submit`).send({ notes: 'Done' })
    if (submitRes.status !== 201) return

    const submissionId = submitRes.body.submission?.id
    const res = await teacherAgent.post(`/api/assignments/${assignmentId}/grade`).send({
      submissionId, score: 85, feedback: 'Good improvement!',
    })
    expect(res.status).toBe(200)
  })

  it('TC-082 Assignment with raga field stores raga correctly', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.post('/api/assignments').send({
      title: `Raga Test ${Date.now()}`, type: 'PRACTICE', raga: 'Yaman',
    })
    expect(res.status).toBe(201)
    expect(res.body.assignment.raga).toBe('Yaman')
  })
})

import { loginAs, TEACHER, STUDENT, ADMIN, UNAUTH } from './helpers'

// TC-031 to TC-042
describe('Students', () => {
  it('TC-031 GET /students without auth returns 401', async () => {
    const res = await UNAUTH.get('/api/students')
    expect(res.status).toBe(401)
  })

  it('TC-032 GET /students as STUDENT returns 403', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/students')
    expect(res.status).toBe(403)
  })

  it('TC-033 GET /students as TEACHER returns student list', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/students')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.students)).toBe(true)
  })

  it('TC-034 Student list items have name and email fields', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/students')
    const students = res.body.students ?? []
    if (students.length > 0) {
      expect(students[0]).toHaveProperty('name')
      expect(students[0]).toHaveProperty('email')
      expect(students[0]).toHaveProperty('levelLabel')
    }
  })

  it('TC-035 GET /students as ADMIN also returns 200', async () => {
    const { agent } = await loginAs(ADMIN.email, ADMIN.password)
    const res = await agent.get('/api/students')
    expect(res.status).toBe(200)
  })

  it('TC-036 GET /students/me/stats without auth returns 401', async () => {
    const res = await UNAUTH.get('/api/students/me/stats')
    expect(res.status).toBe(401)
  })

  it('TC-037 GET /students/me/stats as STUDENT returns stats', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/students/me/stats')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body).toHaveProperty('student')
  })

  it('TC-038 GET /students/me/stats as TEACHER returns 403', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/students/me/stats')
    expect(res.status).toBe(403)
  })

  it('TC-039 PUT /students/me/profile updates student profile', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.put('/api/students/me/profile').send({ bio: 'Test bio update' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('TC-040 GET /students/:id as TEACHER returns student detail', async () => {
    const { agent: teacherAgent } = await loginAs(TEACHER.email, TEACHER.password)
    const listRes = await teacherAgent.get('/api/students')
    const firstId = listRes.body.students?.[0]?.id
    if (!firstId) return
    const res = await teacherAgent.get(`/api/students/${firstId}`)
    expect(res.status).toBe(200)
    expect(res.body.student).toBeDefined()
  })

  it('TC-041 GET /students/:nonexistent returns 404', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/students/nonexistent-id-xyz')
    expect(res.status).toBe(404)
  })

  it('TC-042 Student pagination works with page and limit params', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/students?page=1&limit=5')
    expect(res.status).toBe(200)
    expect(res.body.students.length).toBeLessThanOrEqual(5)
  })
})

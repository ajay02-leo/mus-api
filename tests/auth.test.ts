import supertest from 'supertest'
import { BASE, loginAs, TEACHER, STUDENT, ADMIN, UNAUTH } from './helpers'

// TC-004 to TC-020
describe('Auth', () => {
  it('TC-004 POST /auth/login with valid teacher creds returns 200 + user', async () => {
    const res = await UNAUTH.post('/api/auth/login').send(TEACHER)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.user.role).toBe('TEACHER')
    expect(res.body.token).toBeDefined()
  })

  it('TC-005 POST /auth/login with valid student creds returns STUDENT role', async () => {
    const res = await UNAUTH.post('/api/auth/login').send(STUDENT)
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('STUDENT')
  })

  it('TC-006 POST /auth/login with valid admin creds returns ADMIN role', async () => {
    const res = await UNAUTH.post('/api/auth/login').send(ADMIN)
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('ADMIN')
  })

  it('TC-007 POST /auth/login with wrong password returns 401', async () => {
    const res = await UNAUTH.post('/api/auth/login').send({ email: TEACHER.email, password: 'WrongPass!' })
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('TC-008 POST /auth/login with unknown email returns 404', async () => {
    const res = await UNAUTH.post('/api/auth/login').send({ email: 'nobody@swara.test', password: 'x' })
    expect(res.status).toBe(404)
  })

  it('TC-009 POST /auth/login with missing password returns 4xx', async () => {
    const res = await UNAUTH.post('/api/auth/login').send({ email: TEACHER.email })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('TC-010 GET /auth/me without auth returns 401', async () => {
    const res = await UNAUTH.get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('TC-011 GET /auth/me with valid cookie returns user', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/auth/me')
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(TEACHER.email)
  })

  it('TC-012 POST /auth/logout clears session', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const logout = await agent.post('/api/auth/logout')
    expect(logout.status).toBe(200)
    const me = await agent.get('/api/auth/me')
    expect(me.status).toBe(401)
  })

  it('TC-013 POST /auth/register with duplicate email returns 409', async () => {
    const res = await UNAUTH.post('/api/auth/register').send({
      email: STUDENT.email, password: 'Test1234!', name: 'Dup', role: 'STUDENT',
    })
    expect(res.status).toBe(409)
  })

  it('TC-014 POST /auth/register with new email creates account', async () => {
    const email = `test-${Date.now()}@swara.test`
    const res = await UNAUTH.post('/api/auth/register').send({
      email, password: 'Test1234!', name: 'Test User', role: 'STUDENT',
    })
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe(email)
  })

  it('TC-015 Bearer token auth works as alternative to cookie', async () => {
    const loginRes = await UNAUTH.post('/api/auth/login').send(TEACHER)
    const token = loginRes.body.token
    const res = await UNAUTH.get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('TEACHER')
  })

  it('TC-016 Invalid Bearer token returns 401', async () => {
    const res = await UNAUTH.get('/api/auth/me').set('Authorization', 'Bearer invalid.token.here')
    expect(res.status).toBe(401)
  })

  it('TC-017 PATCH /auth/password with wrong current password returns 401', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.patch('/api/auth/password').send({ currentPassword: 'Wrong!', newPassword: 'New1234!' })
    expect(res.status).toBe(401)
  })
})

import { loginAs, TEACHER, STUDENT, ADMIN, UNAUTH } from './helpers'

// TC-105 to TC-120 — Resources, Earnings, Community, Settings, Reports
describe('Resources', () => {
  it('TC-105 GET /resources without auth returns 401', async () => {
    const res = await UNAUTH.get('/api/resources')
    expect(res.status).toBe(401)
  })

  it('TC-106 GET /resources as TEACHER returns teacher resources', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/resources')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.resources)).toBe(true)
  })

  it('TC-107 POST /resources as TEACHER creates resource', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.post('/api/resources').send({
      title: `Test PDF ${Date.now()}`, type: 'PDF', url: 'https://example.com/notations.pdf',
    })
    expect(res.status).toBe(201)
    expect(res.body.resource.id).toBeDefined()
  })

  it('TC-108 POST /resources as STUDENT returns 403', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.post('/api/resources').send({ title: 'Hack', type: 'LINK', url: 'x' })
    expect(res.status).toBe(403)
  })

  it('TC-109 DELETE /resources/:id as TEACHER deletes it', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const create = await agent.post('/api/resources').send({
      title: `DelRes ${Date.now()}`, type: 'LINK', url: 'https://example.com',
    })
    const id = create.body.resource.id
    const res = await agent.delete(`/api/resources/${id}`)
    expect(res.status).toBe(200)
  })
})

describe('Earnings', () => {
  it('TC-110 GET /earnings without auth returns 401', async () => {
    const res = await UNAUTH.get('/api/earnings')
    expect(res.status).toBe(401)
  })

  it('TC-111 GET /earnings as TEACHER returns earnings', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/earnings')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('TC-112 GET /earnings as STUDENT returns 403', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/earnings')
    expect(res.status).toBe(403)
  })
})

describe('Community', () => {
  it('TC-113 GET /community/posts returns public posts', async () => {
    const res = await UNAUTH.get('/api/community/posts')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.posts)).toBe(true)
  })

  it('TC-114 POST /community/posts requires auth', async () => {
    const res = await UNAUTH.post('/api/community/posts').send({ title: 'x', body: 'y', category: 'general' })
    expect(res.status).toBe(401)
  })

  it('TC-115 POST /community/posts as STUDENT creates post', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.post('/api/community/posts').send({
      title: `My Practice ${Date.now()}`, body: 'Worked on Bhairavi today', category: 'practice',
    })
    expect(res.status).toBe(201)
    expect(res.body.post.id).toBeDefined()
  })

  it('TC-116 GET /community/stats returns statistics', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/community/stats')
    expect(res.status).toBe(200)
  })
})

describe('Settings', () => {
  it('TC-117 GET /settings without auth returns 401', async () => {
    const res = await UNAUTH.get('/api/settings')
    expect(res.status).toBe(401)
  })

  it('TC-118 GET /settings as STUDENT returns settings object', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/settings')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('TC-119 PUT /settings updates notification preferences', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.put('/api/settings').send({ notifAssignments: false, notifSessions: true })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

describe('Reports', () => {
  it('TC-120 GET /reports/monthly without auth returns 401', async () => {
    const res = await UNAUTH.get('/api/reports/monthly')
    expect(res.status).toBe(401)
  })

  it('TC-121 GET /reports/monthly as TEACHER returns report data', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/reports/monthly')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.report)).toBe(true)
  })

  it('TC-122 GET /reports/monthly as STUDENT returns 403', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/reports/monthly')
    expect(res.status).toBe(403)
  })

  it('TC-123 GET /reports/monthly?month=1&year=2025 filters by month', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/reports/monthly?month=1&year=2025')
    expect(res.status).toBe(200)
    expect(res.body.month).toBe(1)
    expect(res.body.year).toBe(2025)
  })
})

describe('Teachers Profile', () => {
  it('TC-124 GET /teachers/me/profile as TEACHER returns profile', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/teachers/me/profile')
    expect(res.status).toBe(200)
    expect(res.body.profile).toBeDefined()
  })

  it('TC-125 PUT /teachers/me/profile updates teacher bio', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.put('/api/teachers/me/profile').send({ bio: 'Expert in Carnatic music' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('TC-126 GET /teachers/me/profile as STUDENT returns 403', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/teachers/me/profile')
    expect(res.status).toBe(403)
  })
})

describe('Recordings', () => {
  it('TC-127 GET /recordings/my without auth returns 401', async () => {
    const res = await UNAUTH.get('/api/recordings/my')
    expect(res.status).toBe(401)
  })

  it('TC-128 GET /recordings/my as STUDENT returns array', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/recordings/my')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.recordings)).toBe(true)
  })

  it('TC-129 GET /recordings/my as TEACHER returns array', async () => {
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.get('/api/recordings/my')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.recordings)).toBe(true)
  })

  it('TC-130 POST /recordings/upload without file returns 4xx or 5xx', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.post('/api/recordings/upload').set('Content-Type', 'multipart/form-data')
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})

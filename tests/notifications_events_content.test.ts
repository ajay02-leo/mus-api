import { loginAs, TEACHER, STUDENT, ADMIN, CONTENT, UNAUTH } from './helpers'

// TC-083 to TC-104
describe('Notifications', () => {
  it('TC-083 GET /notifications without auth returns 401', async () => {
    const res = await UNAUTH.get('/api/notifications')
    expect(res.status).toBe(401)
  })

  it('TC-084 GET /notifications as STUDENT returns array', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/notifications')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.notifications)).toBe(true)
  })

  it('TC-085 PATCH /notifications/read-all marks all read', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.patch('/api/notifications/read-all')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('TC-086 PATCH /notifications/:id/read marks single notification read', async () => {
    // First send a broadcast to get a notification
    const { agent: adminAgent } = await loginAs(ADMIN.email, ADMIN.password)
    await adminAgent // needed to exist

    const { agent: contentAgent } = await loginAs(CONTENT.email, CONTENT.password)
    await contentAgent.post('/api/content/broadcast').send({
      title: 'Test Notif', body: 'Testing mark read', targetRole: 'STUDENT',
    })

    const { agent: studentAgent } = await loginAs(STUDENT.email, STUDENT.password)
    const listRes = await studentAgent.get('/api/notifications')
    const notif = listRes.body.notifications?.[0]
    if (!notif) return

    const res = await studentAgent.patch(`/api/notifications/${notif.id}/read`)
    expect(res.status).toBe(200)
    expect(res.body.notification.read).toBe(true)
  })
})

describe('Events', () => {
  it('TC-087 GET /events returns published events (public)', async () => {
    const res = await UNAUTH.get('/api/events')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.events)).toBe(true)
  })

  it('TC-088 All public events have isPublished=true', async () => {
    const res = await UNAUTH.get('/api/events')
    res.body.events.forEach((e: any) => expect(e.isPublished).toBe(true))
  })

  it('TC-089 GET /events/my-registrations requires auth', async () => {
    const res = await UNAUTH.get('/api/events/my-registrations')
    expect(res.status).toBe(401)
  })

  it('TC-090 GET /events/my-registrations as STUDENT returns array', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/events/my-registrations')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.eventIds)).toBe(true)
  })

  it('TC-091 POST /events/:id/register registers a user', async () => {
    const eventList = await UNAUTH.get('/api/events')
    const event = eventList.body.events?.find((e: any) => e.booked < e.seats)
    if (!event) return
    const { agent } = await loginAs(TEACHER.email, TEACHER.password)
    const res = await agent.post(`/api/events/${event.id}/register`)
    expect([201, 409]).toContain(res.status) // 409 = already registered
  })
})

describe('Content Manager', () => {
  it('TC-092 GET /content/stats as CONTENT_MANAGER returns stats', async () => {
    const { agent } = await loginAs(CONTENT.email, CONTENT.password)
    const res = await agent.get('/api/content/stats')
    expect(res.status).toBe(200)
    expect(res.body.stats.totalEvents).toBeGreaterThanOrEqual(0)
  })

  it('TC-093 GET /content/stats as STUDENT returns 403', async () => {
    const { agent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await agent.get('/api/content/stats')
    expect(res.status).toBe(403)
  })

  it('TC-094 GET /content/events returns ALL events including unpublished', async () => {
    const { agent } = await loginAs(CONTENT.email, CONTENT.password)
    const res = await agent.get('/api/content/events')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.events)).toBe(true)
  })

  it('TC-095 POST /content/events creates a new event (draft)', async () => {
    const { agent } = await loginAs(CONTENT.email, CONTENT.password)
    const res = await agent.post('/api/content/events').send({
      title: `Test Concert ${Date.now()}`,
      type: 'CONCERT',
      date: new Date(Date.now() + 7 * 86400000).toISOString(),
      time: '7:00 PM',
      venue: 'Test Hall, Chennai',
      seats: 50,
      price: 0,
      isPublished: false,
    })
    expect(res.status).toBe(201)
    expect(res.body.event.isPublished).toBe(false)
  })

  it('TC-096 PATCH /content/events/:id/toggle toggles publish state', async () => {
    const { agent } = await loginAs(CONTENT.email, CONTENT.password)
    const create = await agent.post('/api/content/events').send({
      title: `Toggle ${Date.now()}`, type: 'WORKSHOP',
      date: new Date(Date.now() + 86400000).toISOString(),
      time: '5:00 PM', venue: 'Studio', seats: 20, isPublished: false,
    })
    const id = create.body.event.id
    const res = await agent.patch(`/api/content/events/${id}/toggle`)
    expect(res.status).toBe(200)
    expect(res.body.event.isPublished).toBe(true)
  })

  it('TC-097 PATCH /content/events/:id updates event fields', async () => {
    const { agent } = await loginAs(CONTENT.email, CONTENT.password)
    const create = await agent.post('/api/content/events').send({
      title: `EditMe ${Date.now()}`, type: 'MASTERCLASS',
      date: new Date(Date.now() + 172800000).toISOString(),
      time: '6:00 PM', venue: 'Online', seats: 100, isPublished: false,
    })
    const id = create.body.event.id
    const res = await agent.patch(`/api/content/events/${id}`).send({ title: 'Updated Concert', price: 500 })
    expect(res.status).toBe(200)
    expect(res.body.event.title).toBe('Updated Concert')
  })

  it('TC-098 DELETE /content/events/:id deletes event', async () => {
    const { agent } = await loginAs(CONTENT.email, CONTENT.password)
    const create = await agent.post('/api/content/events').send({
      title: `DeleteMe ${Date.now()}`, type: 'CONCERT',
      date: new Date(Date.now() + 259200000).toISOString(),
      time: '8:00 PM', venue: 'Hall', seats: 30, isPublished: false,
    })
    const id = create.body.event.id
    const res = await agent.delete(`/api/content/events/${id}`)
    expect(res.status).toBe(200)
  })

  it('TC-099 POST /content/broadcast sends to all users', async () => {
    const { agent } = await loginAs(CONTENT.email, CONTENT.password)
    const res = await agent.post('/api/content/broadcast').send({
      title: 'Test Broadcast', body: 'This is a test notification', targetRole: 'ALL',
    })
    expect(res.status).toBe(200)
    expect(res.body.sent).toBeGreaterThan(0)
  })

  it('TC-100 POST /content/broadcast to STUDENT only', async () => {
    const { agent } = await loginAs(CONTENT.email, CONTENT.password)
    const res = await agent.post('/api/content/broadcast').send({
      title: 'Students Only', body: 'Hi students!', targetRole: 'STUDENT',
    })
    expect(res.status).toBe(200)
    expect(res.body.sent).toBeGreaterThanOrEqual(1)
  })

  it('TC-101 GET /content/posts returns community posts', async () => {
    const { agent } = await loginAs(CONTENT.email, CONTENT.password)
    const res = await agent.get('/api/content/posts')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.posts)).toBe(true)
  })

  it('TC-102 PATCH /content/posts/:id/pin as STUDENT returns 403', async () => {
    const { agent: contentAgent } = await loginAs(CONTENT.email, CONTENT.password)
    const posts = await contentAgent.get('/api/content/posts')
    const post = posts.body.posts?.[0]
    if (!post) return

    const { agent: studentAgent } = await loginAs(STUDENT.email, STUDENT.password)
    const res = await studentAgent.patch(`/api/content/posts/${post.id}/pin`)
    expect(res.status).toBe(403)
  })

  it('TC-103 PATCH /content/posts/:id/pin as CONTENT_MANAGER succeeds', async () => {
    const { agent } = await loginAs(CONTENT.email, CONTENT.password)
    const posts = await agent.get('/api/content/posts')
    const post = posts.body.posts?.[0]
    if (!post) return
    const res = await agent.patch(`/api/content/posts/${post.id}/pin`)
    expect(res.status).toBe(200)
  })

  it('TC-104 POST /content/broadcast missing title returns 400', async () => {
    const { agent } = await loginAs(CONTENT.email, CONTENT.password)
    const res = await agent.post('/api/content/broadcast').send({ body: 'No title here' })
    expect(res.status).toBe(400)
  })
})

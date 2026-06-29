import supertest from 'supertest'
import { BASE } from './helpers'

const req = supertest(BASE)

// TC-001 to TC-003
describe('Health & Server', () => {
  it('TC-001 GET /health returns 200 and status ok', async () => {
    const res = await req.get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.ts).toBeDefined()
  })

  it('TC-002 Unknown route returns 404', async () => {
    const res = await req.get('/api/nonexistent-route-xyz')
    expect(res.status).toBe(404)
  })

  it('TC-003 API docs endpoint is accessible', async () => {
    const res = await req.get('/api/docs.json')
    expect(res.status).toBe(200)
    expect(res.body.info.title).toBe('SwaraSangam API')
  })
})

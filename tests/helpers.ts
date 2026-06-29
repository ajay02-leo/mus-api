import supertest from 'supertest'

export const BASE = 'http://localhost:4000'

// Creates an authenticated supertest agent (cookie-based)
export async function loginAs(email: string, password: string) {
  const agent = supertest.agent(BASE)
  const res = await agent.post('/api/auth/login').send({ email, password })
  return { agent, user: res.body?.user, token: res.body?.token }
}

export const TEACHER  = { email: 'demo-teacher@swara.test', password: 'Demo1234!' }
export const STUDENT  = { email: 'demo-student@swara.test', password: 'Demo1234!' }
export const ADMIN    = { email: 'admin@swara.test',         password: 'Admin1234!' }
export const CONTENT  = { email: 'content@swara.test',       password: 'Content1234!' }

export const UNAUTH = supertest(BASE)

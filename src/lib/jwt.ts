import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'dev-secret'
const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

export interface TokenPayload { userId: string; role: string }

export const signToken = (payload: TokenPayload) =>
  jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions)

export const verifyToken = (token: string): TokenPayload | null => {
  try { return jwt.verify(token, SECRET) as TokenPayload }
  catch { return null }
}

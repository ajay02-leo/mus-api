import { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from '../lib/jwt'

export interface AuthRequest extends Request {
  user?: TokenPayload
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.token as string | undefined
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined

  const token = cookieToken ?? headerToken
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' })

  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ success: false, message: 'Invalid or expired token' })

  req.user = payload
  return next()
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' })
    if (!roles.includes(req.user.role))
      return res.status(403).json({ success: false, message: `Requires role: ${roles.join(' or ')}` })
    return next()
  }
}

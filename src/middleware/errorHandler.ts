import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message)
  const status = (err as any).statusCode ?? 500
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : err.message,
  })
}

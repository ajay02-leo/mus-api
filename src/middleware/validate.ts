import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      return next()
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(422).json({
          success: false,
          message: 'Validation error',
          errors: err.flatten().fieldErrors,
        })
      }
      return next(err)
    }
  }
}

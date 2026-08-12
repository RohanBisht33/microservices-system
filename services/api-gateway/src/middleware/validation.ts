import { Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../errors/app-errors.js';
import { AuthenticatedRequest } from '../types/index.js';

export function validateRequest(schema: ZodSchema) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      throw new ValidationError(`Invalid request data: ${errorMessage}`);
    }
    req.body = result.data;
    next();
  };
}

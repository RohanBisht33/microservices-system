import { Response, NextFunction } from 'express';
import { AppError } from '../errors/app-errors.js';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../types/index.js';

export function errorHandlerMiddleware(
  err: Error,
  req: AuthenticatedRequest,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const correlationId = req.correlationId || 'unknown';

  if (err instanceof AppError) {
    logger.warn({ err, correlationId }, `AppError: ${err.message}`);
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        correlationId,
      },
    });
    return;
  }

  logger.error({ err, correlationId }, 'Unhandled server error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal server error occurred',
      correlationId,
    },
  });
}

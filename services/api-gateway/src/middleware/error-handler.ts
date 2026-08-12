import { Response, NextFunction } from 'express';
import { AppError } from '../errors/app-errors.js';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../types/index.js';
import axios from 'axios';

export function errorHandlerMiddleware(
  err: Error,
  req: AuthenticatedRequest,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const correlationId = req.correlationId || 'unknown';

  if (err instanceof AppError) {
    logger.warn({ err, correlationId }, `Gateway AppError: ${err.message}`);
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        correlationId,
      },
    });
    return;
  }

  // Handle downstream service errors forwarded via Axios
  if (axios.isAxiosError(err) && err.response) {
    const status = err.response.status;
    const responseData = err.response.data;

    logger.warn({ status, responseData, correlationId }, 'Forwarded downstream service error');

    if (responseData?.error?.code && responseData?.error?.message) {
      res.status(status).json({
        error: {
          code: responseData.error.code,
          message: responseData.error.message,
          correlationId: responseData.error.correlationId || correlationId,
        },
      });
      return;
    }

    res.status(status).json({
      error: {
        code: 'DOWNSTREAM_ERROR',
        message: responseData?.message || 'Error returned from internal service',
        correlationId,
      },
    });
    return;
  }

  logger.error({ err, correlationId }, 'Unhandled Gateway server error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected gateway error occurred',
      correlationId,
    },
  });
}

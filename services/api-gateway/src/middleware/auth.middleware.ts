import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UnauthorizedError } from '../errors/app-errors.js';
import { AuthenticatedRequest, UserPayload } from '../types/index.js';

export function authenticateGatewayJWT(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as UserPayload;
    req.user = payload;
    req.token = token;
    next();
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

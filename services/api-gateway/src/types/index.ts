import { Request } from 'express';

export interface UserPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
  correlationId?: string;
  token?: string;
}

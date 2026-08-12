import { Response, NextFunction } from 'express';
import { ServiceHttpClient } from '../services/http-client.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AuthController {
  constructor(private readonly httpClient: ServiceHttpClient) {}

  signup = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.httpClient.postToUserService(
        '/internal/auth/signup',
        req.body,
        req.correlationId || ''
      );
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.httpClient.postToUserService(
        '/internal/auth/login',
        req.body,
        req.correlationId || ''
      );
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.httpClient.postToUserService(
        '/internal/auth/refresh',
        req.body,
        req.correlationId || ''
      );
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.httpClient.postToUserService(
        '/internal/auth/logout',
        req.body,
        req.correlationId || ''
      );
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };
}

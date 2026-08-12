import { Response, NextFunction } from 'express';
import { ServiceHttpClient } from '../services/http-client.js';
import { AuthenticatedRequest } from '../types/index.js';

export class UserController {
  constructor(private readonly httpClient: ServiceHttpClient) {}

  getUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.httpClient.getFromUserService(
        `/internal/users/${id}`,
        req.correlationId || '',
        req.token
      );
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.httpClient.patchUserService(
        `/internal/users/${id}`,
        req.body,
        req.correlationId || '',
        req.token
      );
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.httpClient.deleteUserService(
        `/internal/users/${id}`,
        req.correlationId || '',
        req.token
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  requestPasswordReset = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.httpClient.postToUserService(
        `/internal/users/${id}/request-password-reset`,
        req.body,
        req.correlationId || ''
      );
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };
}

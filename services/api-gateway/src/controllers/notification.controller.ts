import { Response, NextFunction } from 'express';
import { ServiceHttpClient } from '../services/http-client.js';
import { AuthenticatedRequest } from '../types/index.js';

export class NotificationController {
  constructor(private readonly httpClient: ServiceHttpClient) {}

  getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const data = await this.httpClient.getFromNotificationService(
        `/internal/notifications?userId=${userId}`,
        req.correlationId || '',
        req.token
      );
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };
}

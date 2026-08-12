import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ForbiddenError, ValidationError } from '../errors/app-errors.js';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  getUserNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const queryUserId = req.query.userId as string;
      const authenticatedUserId = req.user?.userId;

      if (!queryUserId) {
        throw new ValidationError('userId query parameter is required');
      }

      if (authenticatedUserId !== queryUserId) {
        throw new ForbiddenError('You can only view your own notification history');
      }

      const notifications = await this.notificationService.getUserNotifications(queryUserId);
      res.status(200).json(notifications);
    } catch (err) {
      next(err);
    }
  };
}

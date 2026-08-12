import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { z } from 'zod';
import { ValidationError, ForbiddenError } from '../errors/app-errors.js';

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export class UserController {
  constructor(private readonly userService: UserService) {}

  getUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (req.user?.userId !== id) {
        throw new ForbiddenError('You can only update your own user profile');
      }

      const parsed = UpdateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
      }

      const updated = await this.userService.updateUser(id, parsed.data, req.correlationId || '');
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  };

  deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (req.user?.userId !== id) {
        throw new ForbiddenError('You can only delete your own account');
      }

      await this.userService.deleteUser(id, req.correlationId || '');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  requestPasswordReset = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.userService.requestPasswordReset(id, req.correlationId || '');
      res.status(200).json({ message: 'Password reset request received' });
    } catch (err) {
      next(err);
    }
  };
}

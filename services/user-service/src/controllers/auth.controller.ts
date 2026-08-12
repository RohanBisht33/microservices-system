import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { z } from 'zod';
import { ValidationError } from '../errors/app-errors.js';

const SignupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  signup = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = SignupSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
      }
      const result = await this.authService.signup(parsed.data, req.correlationId || '');
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
      }
      const result = await this.authService.login(parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = RefreshSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Refresh token is required');
      }
      const result = await this.authService.refreshTokens(parsed.data.refreshToken);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = RefreshSchema.safeParse(req.body);
      if (parsed.success) {
        await this.authService.logout(parsed.data.refreshToken);
      }
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  };
}

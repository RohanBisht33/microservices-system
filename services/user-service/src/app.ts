import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { correlationIdMiddleware } from './middleware/correlation-id.js';
import { errorHandlerMiddleware } from './middleware/error-handler.js';
import { authenticateJWT } from './middleware/auth.middleware.js';
import { authRateLimiter } from './middleware/rate-limit.js';
import { UserRepository } from './repositories/user.repository.js';
import { AuthService } from './services/auth.service.js';
import { UserService } from './services/user.service.js';
import { AuthController } from './controllers/auth.controller.js';
import { UserController } from './controllers/user.controller.js';
import { HealthController } from './controllers/health.controller.js';
import { IEventPublisher } from '@microservices/events';

export function createApp(prisma: PrismaClient, publisher: IEventPublisher) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(correlationIdMiddleware);

  const userRepository = new UserRepository(prisma);
  const authService = new AuthService(userRepository, publisher);
  const userService = new UserService(userRepository, publisher);

  const authController = new AuthController(authService);
  const userController = new UserController(userService);
  const healthController = new HealthController(prisma, publisher);

  // Health checks
  app.get('/health', healthController.getHealth);
  app.get('/ready', healthController.getReady);

  // Internal Auth endpoints
  app.post('/internal/auth/signup', authRateLimiter, authController.signup);
  app.post('/internal/auth/login', authRateLimiter, authController.login);
  app.post('/internal/auth/refresh', authController.refresh);
  app.post('/internal/auth/logout', authController.logout);

  // Password reset request
  app.post('/internal/users/:id/request-password-reset', userController.requestPasswordReset);

  // Internal User endpoints (JWT protected)
  app.get('/internal/users/:id', authenticateJWT, userController.getUser);
  app.patch('/internal/users/:id', authenticateJWT, userController.updateUser);
  app.delete('/internal/users/:id', authenticateJWT, userController.deleteUser);

  // Centralized Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { correlationIdMiddleware } from './middleware/correlation-id.js';
import { errorHandlerMiddleware } from './middleware/error-handler.js';
import { authenticateGatewayJWT } from './middleware/auth.middleware.js';
import { globalRateLimiter, authRateLimiter } from './middleware/rate-limit.js';
import { validateRequest } from './middleware/validation.js';
import { ServiceHttpClient } from './services/http-client.js';
import { AuthController } from './controllers/auth.controller.js';
import { UserController } from './controllers/user.controller.js';
import { NotificationController } from './controllers/notification.controller.js';
import {
  SignupValidationSchema,
  LoginValidationSchema,
  RefreshValidationSchema,
  UpdateUserValidationSchema,
} from './validators/auth.validators.js';
import { setupSwagger } from './docs/swagger.js';

export function createApp(httpClient?: ServiceHttpClient) {
  const app = express();
  const client = httpClient || new ServiceHttpClient();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(correlationIdMiddleware);

  // Global rate limiter
  app.use(globalRateLimiter);

  // Serve OpenAPI Documentation
  setupSwagger(app);

  const authController = new AuthController(client);
  const userController = new UserController(client);
  const notificationController = new NotificationController(client);

  // Liveness health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'UP', service: 'api-gateway', timestamp: new Date().toISOString() });
  });

  // Auth routes (public with auth rate limiting)
  app.post(
    '/api/auth/signup',
    authRateLimiter,
    validateRequest(SignupValidationSchema),
    authController.signup
  );
  app.post(
    '/api/auth/login',
    authRateLimiter,
    validateRequest(LoginValidationSchema),
    authController.login
  );
  app.post('/api/auth/refresh', validateRequest(RefreshValidationSchema), authController.refresh);
  app.post('/api/auth/logout', authController.logout);

  // Password reset request (public)
  app.post('/api/users/:id/request-password-reset', userController.requestPasswordReset);

  // User management routes (JWT required)
  app.get('/api/users/:id', authenticateGatewayJWT, userController.getUser);
  app.patch(
    '/api/users/:id',
    authenticateGatewayJWT,
    validateRequest(UpdateUserValidationSchema),
    userController.updateUser
  );
  app.delete('/api/users/:id', authenticateGatewayJWT, userController.deleteUser);

  // Notification routes (JWT required)
  app.get('/api/notifications', authenticateGatewayJWT, notificationController.getNotifications);

  // Centralized Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}

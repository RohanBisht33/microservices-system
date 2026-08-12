import pino from 'pino';
import { config } from '../config/env.js';

export const logger = pino({
  level: config.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: ['password', 'passwordHash', 'token', 'authorization', 'headers.authorization'],
  base: {
    service: 'user-service',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

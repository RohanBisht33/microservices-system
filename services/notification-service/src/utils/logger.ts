import pino from 'pino';
import { config } from '../config/env.js';

export const logger = pino({
  level: config.NODE_ENV === 'test' ? 'silent' : 'info',
  base: {
    service: 'notification-service',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

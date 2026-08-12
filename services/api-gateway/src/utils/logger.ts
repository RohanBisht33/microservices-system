import pino from 'pino';
import { config } from '../config/env.js';

export const logger = pino({
  level: config.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: ['password', 'token', 'authorization', 'headers.authorization'],
  base: {
    service: 'api-gateway',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

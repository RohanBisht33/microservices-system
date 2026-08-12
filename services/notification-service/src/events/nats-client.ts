import { connect, NatsConnection } from 'nats';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class NatsClientSingleton {
  private static instance: NatsConnection | null = null;
  private static isConnecting = false;

  public static async getInstance(): Promise<NatsConnection> {
    if (this.instance && !this.instance.isClosed()) {
      return this.instance;
    }

    if (this.isConnecting) {
      while (this.isConnecting) {
        await new Promise((res) => setTimeout(res, 100));
      }
      if (this.instance && !this.instance.isClosed()) {
        return this.instance;
      }
    }

    this.isConnecting = true;

    try {
      const connectOptions: any = {
        servers: [config.NATS_URL],
        token: config.NATS_AUTH_TOKEN,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 2000,
      };

      if (config.NATS_TLS_CA_PATH && fs.existsSync(path.resolve(config.NATS_TLS_CA_PATH))) {
        connectOptions.tls = {
          ca: [fs.readFileSync(path.resolve(config.NATS_TLS_CA_PATH))],
        };
      }

      logger.info({ url: config.NATS_URL }, 'Connecting to NATS server...');
      this.instance = await connect(connectOptions);
      logger.info('Successfully connected to NATS server');

      return this.instance;
    } catch (err) {
      logger.error({ err }, 'Failed to connect to NATS');
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  public static async close(): Promise<void> {
    if (this.instance && !this.instance.isClosed()) {
      await this.instance.drain();
      this.instance = null;
      logger.info('NATS connection drained and closed');
    }
  }

  public static isConnected(): boolean {
    return this.instance !== null && !this.instance.isClosed();
  }
}

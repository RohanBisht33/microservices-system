import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { IEventSubscriber } from '@microservices/events';

export class HealthController {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly subscriber: IEventSubscriber
  ) {}

  getHealth = (_req: Request, res: Response): void => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
  };

  getReady = async (_req: Request, res: Response): Promise<void> => {
    let dbHealthy = false;
    let natsHealthy = false;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }

    natsHealthy = this.subscriber.isHealthy();

    const isReady = dbHealthy && natsHealthy;
    const statusCode = isReady ? 200 : 530;

    res.status(statusCode).json({
      status: isReady ? 'READY' : 'NOT_READY',
      checks: {
        database: dbHealthy ? 'UP' : 'DOWN',
        nats: natsHealthy ? 'UP' : 'DOWN',
      },
      timestamp: new Date().toISOString(),
    });
  };
}

import { PrismaClient, Notification } from '@prisma/client';

export class NotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createNotification(data: {
    userId: string;
    type: string;
    channel: string;
    status: string;
    correlationId: string;
    eventId: string;
  }): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

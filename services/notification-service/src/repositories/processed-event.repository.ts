import { PrismaClient, ProcessedEvent } from '@prisma/client';

export class ProcessedEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async isProcessed(eventId: string): Promise<boolean> {
    const record = await this.prisma.processedEvent.findUnique({
      where: { eventId },
    });
    return record !== null;
  }

  async markProcessed(eventId: string): Promise<ProcessedEvent> {
    return this.prisma.processedEvent.create({
      data: { eventId },
    });
  }
}

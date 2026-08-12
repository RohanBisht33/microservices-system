import { UserRepository } from '../repositories/user.repository.js';
import { NotFoundError } from '../errors/app-errors.js';
import {
  IEventPublisher,
  EVENT_SUBJECTS,
  UserUpdatedEvent,
  UserDeletedEvent,
  PasswordResetRequestedEvent,
} from '@microservices/events';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly publisher: IEventPublisher
  ) {}

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
  }

  async updateUser(id: string, data: { name?: string; email?: string }, correlationId: string) {
    await this.getUserById(id);
    const updatedUser = await this.userRepository.updateUser(id, data);

    const event: UserUpdatedEvent = {
      eventId: randomUUID(),
      eventType: EVENT_SUBJECTS.USER_UPDATED,
      occurredAt: new Date().toISOString(),
      correlationId,
      version: 1,
      data: {
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
    };

    try {
      await this.publisher.publish(EVENT_SUBJECTS.USER_UPDATED, event);
    } catch (err) {
      logger.error({ err, correlationId }, 'Failed to publish user.events.updated event');
    }

    return { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name };
  }

  async deleteUser(id: string, correlationId: string) {
    await this.getUserById(id);
    await this.userRepository.softDeleteUser(id);

    const event: UserDeletedEvent = {
      eventId: randomUUID(),
      eventType: EVENT_SUBJECTS.USER_DELETED,
      occurredAt: new Date().toISOString(),
      correlationId,
      version: 1,
      data: { userId: id },
    };

    try {
      await this.publisher.publish(EVENT_SUBJECTS.USER_DELETED, event);
    } catch (err) {
      logger.error({ err, correlationId }, 'Failed to publish user.events.deleted event');
    }
  }

  async requestPasswordReset(id: string, correlationId: string) {
    const user = await this.getUserById(id);

    const event: PasswordResetRequestedEvent = {
      eventId: randomUUID(),
      eventType: EVENT_SUBJECTS.PASSWORD_RESET_REQUESTED,
      occurredAt: new Date().toISOString(),
      correlationId,
      version: 1,
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
    };

    try {
      await this.publisher.publish(EVENT_SUBJECTS.PASSWORD_RESET_REQUESTED, event);
    } catch (err) {
      logger.error({ err, correlationId }, 'Failed to publish user.events.password_reset_requested event');
    }
  }
}

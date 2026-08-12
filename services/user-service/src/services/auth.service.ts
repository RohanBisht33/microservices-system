import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { config } from '../config/env.js';
import { UserRepository } from '../repositories/user.repository.js';
import { UnauthorizedError, ConflictError, NotFoundError, ValidationError } from '../errors/app-errors.js';
import { IEventPublisher, EVENT_SUBJECTS, UserCreatedEvent } from '@microservices/events';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly publisher: IEventPublisher
  ) {}

  async signup(data: { email: string; name: string; password: string }, correlationId: string) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.userRepository.createUser({
      email: data.email,
      name: data.name,
      passwordHash,
    });

    // Publish user.events.created
    const event: UserCreatedEvent = {
      eventId: randomUUID(),
      eventType: EVENT_SUBJECTS.USER_CREATED,
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
      await this.publisher.publish(EVENT_SUBJECTS.USER_CREATED, event);
    } catch (err) {
      logger.error({ err, correlationId }, 'Failed to publish user.events.created event');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: { id: user.id, email: user.email, name: user.name }, ...tokens };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: { id: user.id, email: user.email, name: user.name }, ...tokens };
  }

  async refreshTokens(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const tokenRecord = await this.userRepository.findRefreshToken(tokenHash);

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Revoke current token (rotation)
    await this.userRepository.revokeRefreshToken(tokenRecord.id);

    const user = await this.userRepository.findById(tokenRecord.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.generateTokens(user.id, user.email);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const tokenRecord = await this.userRepository.findRefreshToken(tokenHash);
    if (tokenRecord) {
      await this.userRepository.revokeRefreshToken(tokenRecord.id);
    }
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ userId, email }, config.JWT_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRATION as any,
    });

    const rawRefreshToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.JWT_REFRESH_EXPIRATION_DAYS);

    await this.userRepository.createRefreshToken({
      userId,
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

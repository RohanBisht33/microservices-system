import { PrismaClient, User, RefreshToken } from '@prisma/client';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createUser(data: { email: string; name: string; passwordHash: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, isDeleted: false },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, isDeleted: false },
    });
  }

  async updateUser(id: string, data: { name?: string; email?: string }): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async softDeleteUser(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}

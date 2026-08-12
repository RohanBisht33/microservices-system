import { AuthService } from './auth.service.js';
import { ConflictError, UnauthorizedError } from '../errors/app-errors.js';
import bcrypt from 'bcrypt';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let mockPublisher: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
      createRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      findById: jest.fn(),
    };

    mockPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn(),
      disconnect: jest.fn(),
      isHealthy: jest.fn().mockReturnValue(true),
    };

    authService = new AuthService(mockUserRepository, mockPublisher);
  });

  it('creates user and publishes event on successful signup', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.createUser.mockResolvedValue({
      id: 'user-uuid-123',
      email: 'newuser@example.com',
      name: 'New User',
      passwordHash: 'hashedpassword',
    });

    const result = await authService.signup(
      { email: 'newuser@example.com', name: 'New User', password: 'Password123!' },
      'corr-id-123'
    );

    expect(result.user.email).toBe('newuser@example.com');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(mockPublisher.publish).toHaveBeenCalledWith(
      'user.events.created',
      expect.objectContaining({
        eventType: 'user.events.created',
        correlationId: 'corr-id-123',
      })
    );
  });

  it('throws ConflictError if user email already exists', async () => {
    mockUserRepository.findByEmail.mockResolvedValue({ id: 'existing' });

    await expect(
      authService.signup(
        { email: 'existing@example.com', name: 'Existing', password: 'Password123!' },
        'corr-id-123'
      )
    ).rejects.toThrow(ConflictError);
  });

  it('authenticates user login with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('SecretPass123', 10);
    mockUserRepository.findByEmail.mockResolvedValue({
      id: 'user-uuid-123',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash,
    });

    const result = await authService.login({
      email: 'test@example.com',
      password: 'SecretPass123',
    });

    expect(result.user.id).toBe('user-uuid-123');
    expect(result.accessToken).toBeDefined();
  });

  it('rejects login with invalid password', async () => {
    const passwordHash = await bcrypt.hash('SecretPass123', 10);
    mockUserRepository.findByEmail.mockResolvedValue({
      id: 'user-uuid-123',
      email: 'test@example.com',
      passwordHash,
    });

    await expect(
      authService.login({
        email: 'test@example.com',
        password: 'WrongPassword',
      })
    ).rejects.toThrow(UnauthorizedError);
  });
});

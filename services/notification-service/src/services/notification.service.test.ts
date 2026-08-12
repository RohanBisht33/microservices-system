import { NotificationService } from './notification.service.js';

describe('NotificationService Unit Tests', () => {
  let notificationService: NotificationService;
  let mockPrisma: any;
  let mockNotificationRepository: any;
  let mockProcessedEventRepository: any;
  let mockProvider: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn().mockImplementation(async (cb) => {
        return cb({
          notification: { create: jest.fn() },
          processedEvent: { create: jest.fn() },
        });
      }),
    };

    mockNotificationRepository = {
      createNotification: jest.fn(),
      findByUserId: jest.fn(),
    };

    mockProcessedEventRepository = {
      isProcessed: jest.fn(),
      markProcessed: jest.fn(),
    };

    mockProvider = {
      send: jest.fn().mockResolvedValue(true),
    };

    notificationService = new NotificationService(
      mockPrisma,
      mockNotificationRepository,
      mockProcessedEventRepository,
      mockProvider
    );
  });

  it('skips duplicate event processing (Idempotency test)', async () => {
    mockProcessedEventRepository.isProcessed.mockResolvedValue(true);

    const result = await notificationService.processEvent(
      'event-id-123',
      'user-id-456',
      'welcome',
      'email',
      'corr-id-789',
      { to: 'user@example.com', subject: 'Welcome', body: 'Hello' }
    );

    expect(result).toBe(true);
    expect(mockProvider.send).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('processes new event, sends email, and records transaction', async () => {
    mockProcessedEventRepository.isProcessed.mockResolvedValue(false);

    const result = await notificationService.processEvent(
      'event-id-123',
      'user-id-456',
      'welcome',
      'email',
      'corr-id-789',
      { to: 'user@example.com', subject: 'Welcome', body: 'Hello' }
    );

    expect(result).toBe(true);
    expect(mockProvider.send).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Welcome',
      body: 'Hello',
      correlationId: 'corr-id-789',
      type: 'welcome',
    });
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });
});

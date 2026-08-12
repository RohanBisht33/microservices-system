import request from 'supertest';
import { createApp } from './app.js';

describe('API Gateway App Integration & Health Tests', () => {
  let mockHttpClient: any;
  let app: any;

  beforeEach(() => {
    mockHttpClient = {
      postToUserService: jest.fn(),
      getFromUserService: jest.fn(),
      patchUserService: jest.fn(),
      deleteUserService: jest.fn(),
      getFromNotificationService: jest.fn(),
    };

    app = createApp(mockHttpClient);
  });

  it('responds with 200 OK on GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('api-gateway');
  });

  it('rejects invalid signup request payload early with 400 Validation Error', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'not-an-email',
      name: '',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockHttpClient.postToUserService).not.toHaveBeenCalled();
  });

  it('proxies valid signup payload to User Service', async () => {
    mockHttpClient.postToUserService.mockResolvedValue({
      user: { id: 'uuid-1', email: 'test@example.com', name: 'Test' },
      accessToken: 'token',
    });

    const res = await request(app).post('/api/auth/signup').send({
      email: 'test@example.com',
      name: 'Test',
      password: 'SecurePassword123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@example.com');
    expect(mockHttpClient.postToUserService).toHaveBeenCalledWith(
      '/internal/auth/signup',
      { email: 'test@example.com', name: 'Test', password: 'SecurePassword123' },
      expect.any(String)
    );
  });
});

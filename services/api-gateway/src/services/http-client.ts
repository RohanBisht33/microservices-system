import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env.js';

export class ServiceHttpClient {
  private userServiceClient: AxiosInstance;
  private notificationServiceClient: AxiosInstance;

  constructor() {
    this.userServiceClient = axios.create({
      baseURL: config.USER_SERVICE_URL,
      timeout: 10000,
    });

    this.notificationServiceClient = axios.create({
      baseURL: config.NOTIFICATION_SERVICE_URL,
      timeout: 10000,
    });
  }

  async postToUserService(path: string, data: any, correlationId: string, token?: string) {
    const headers: Record<string, string> = {
      'X-Correlation-Id': correlationId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await this.userServiceClient.post(path, data, { headers });
    return response.data;
  }

  async getFromUserService(path: string, correlationId: string, token?: string) {
    const headers: Record<string, string> = {
      'X-Correlation-Id': correlationId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await this.userServiceClient.get(path, { headers });
    return response.data;
  }

  async patchUserService(path: string, data: any, correlationId: string, token?: string) {
    const headers: Record<string, string> = {
      'X-Correlation-Id': correlationId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await this.userServiceClient.patch(path, data, { headers });
    return response.data;
  }

  async deleteUserService(path: string, correlationId: string, token?: string) {
    const headers: Record<string, string> = {
      'X-Correlation-Id': correlationId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await this.userServiceClient.delete(path, { headers });
    return response.data;
  }

  async getFromNotificationService(path: string, correlationId: string, token?: string) {
    const headers: Record<string, string> = {
      'X-Correlation-Id': correlationId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await this.notificationServiceClient.get(path, { headers });
    return response.data;
  }
}

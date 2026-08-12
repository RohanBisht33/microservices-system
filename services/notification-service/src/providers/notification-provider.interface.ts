export interface NotificationPayload {
  to: string;
  subject: string;
  body: string;
  correlationId: string;
  type: string;
}

export interface INotificationProvider {
  send(payload: NotificationPayload): Promise<boolean>;
}

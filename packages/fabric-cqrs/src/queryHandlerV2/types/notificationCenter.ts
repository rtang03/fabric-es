import type { HandlerResponse } from '../../types';

export type NotificationCenter = {
  clearNotification: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId: string;
  }) => Promise<HandlerResponse<string[]>>;
  clearNotifications: (option: {
    creator: string;
    entityName?: string;
    id?: string;
  }) => Promise<HandlerResponse<string[]>>;
  // add notification flag
  notify: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId: string;
    expiryBySec?: number;
  }) => Promise<HandlerResponse<string>>;
  // get notification, and reset to '0', indicating "READ".
  getNotification: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId?: string;
  }) => Promise<HandlerResponse<Record<string, string>>>;
  // get notifications will return a list of notifications. It will NOT reset to 'O'
  getNotificationsByFields: (option: {
    creator: string;
    entityName?: string;
    id?: string;
  }) => Promise<HandlerResponse<Record<string, string>>>;
};

import type { CommonResponse } from './commonResponse';

export type NotificationCenter = {
  clearNotification: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId: string;
  }) => Promise<CommonResponse<string[]>>;
  clearNotifications: (option: {
    creator: string;
    entityName?: string;
    id?: string;
  }) => Promise<CommonResponse<string[]>>;
  // add notification flag
  notify: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId: string;
    expiryBySec?: number;
  }) => Promise<CommonResponse<string>>;
  // get notification, and reset to '0', indicating "READ".
  getNotification: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId?: string;
  }) => Promise<CommonResponse<Record<string, string>>>;
  // get notifications will return a list of notifications. It will NOT reset to 'O'
  getNotificationsByFields: (option: {
    creator: string;
    entityName?: string;
    id?: string;
  }) => Promise<CommonResponse<Record<string, string>>>;
};

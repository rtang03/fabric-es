import type { HandlerResponse } from '../../types';

/**
 * @about notification center
 */
export type NotificationCenter = {
  /** clear one notification **/
  clearNotification: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId: string;
  }) => Promise<HandlerResponse<string[]>>;
  /** clear all notifications **/
  clearNotifications: (option: {
    creator: string;
    entityName?: string;
    id?: string;
  }) => Promise<HandlerResponse<string[]>>;
  /** add new notification **/
  notify: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId: string;
    expiryBySec?: number;
  }) => Promise<HandlerResponse<string>>;
  /** return single notification, and  reset to '0', indicating "READ". **/
  getNotification: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId?: string;
  }) => Promise<HandlerResponse<Record<string, string>>>;
  /** return a list of notifications. It will NOT reset to 'O' **/
  getNotificationsByFields: (option: {
    creator: string;
    entityName?: string;
    id?: string;
  }) => Promise<HandlerResponse<Record<string, string>>>;
};

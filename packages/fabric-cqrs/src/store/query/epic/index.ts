import clearNotificationEpic from './clearNotification';
import clearNotificationsEpic from './clearNotifications';
import deleteByEntityNameEpic from './deleteByEntityName';
import deleteByEntityIdEpic from './deleteCommitByEntityId';
import deleteEntityByEntityNameEpic from './deleteEntityByEntityName';
import fullTextSearchCIdxEpic from './fullTextSearchCIdx';
import fullTextSearchEIdxEpic from './fullTextSearchEIdx';
import getNotificationEpic from './getNotification';
import getNotificationsEpic from './getNotifications';
import mergeEpic from './mergeCommit';
import mergeBatchEpic from './mergeCommitBatch';
import queryByEntityIdEpic from './queryByEntityId';
import queryByEntityNameEpic from './queryByEntityName';

export const epic = [
  deleteByEntityNameEpic,
  deleteByEntityIdEpic,
  queryByEntityNameEpic,
  queryByEntityIdEpic,
  mergeEpic,
  mergeBatchEpic,
  fullTextSearchCIdxEpic,
  fullTextSearchEIdxEpic,
  getNotificationEpic,
  getNotificationsEpic,
  clearNotificationEpic,
  clearNotificationsEpic,
  deleteEntityByEntityNameEpic,
];

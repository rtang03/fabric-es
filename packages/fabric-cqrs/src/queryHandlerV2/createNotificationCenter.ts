import util from 'util';
import { Redisearch } from 'redis-modules-sdk';
import { getLogger } from '../utils';
import { INVALID_ARG, REDIS_ERR } from './constants';
import { pipelineExec } from './pipelineExec';
import type { NotificationCenter } from './types';

export const createNotificationCenter: (client: Redisearch) => NotificationCenter = (client) => {
  const logger = getLogger({
    name: '[query-handler] createNotificationCenter.js',
    target: 'console',
  });

  // if commitId exist, return single key. Otherwise, return pattern, ends with *
  const getPatternOrSingleKey: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId?: string;
  }) => string = ({ creator, entityName, id, commitId }) =>
    commitId
      ? creator && entityName && id && `n:${creator}:${entityName}:${id}:${commitId}`
      : id
      ? creator && entityName && `n:${creator}:${entityName}:${id}:*`
      : entityName
      ? creator && `n:${creator}:${entityName}:*`
      : `n:${creator}:*`;

  return {
    clearNotification: async ({ creator, entityName, id, commitId }) => {
      const key = getPatternOrSingleKey({ creator, entityName, id, commitId });

      if (!key) throw new Error(INVALID_ARG);

      try {
        await client.redis.del(key);
        return { status: 'OK', result: [key] };
      } catch (e) {
        logger.error(util.format('%s, %j', REDIS_ERR, e));
        return { status: 'ERROR', error: [e] };
      }
    },
    clearNotifications: async ({ creator, entityName, id }) => {
      const pattern = getPatternOrSingleKey({ creator, entityName, id });

      if (!pattern) throw new Error(INVALID_ARG);

      try {
        const [_, keys] = await client.redis.scan(0, 'MATCH', pattern);
        const errors = await pipelineExec(client, 'DELETE', pattern).then((data) =>
          data.map(([e]) => e)
        );

        const isError = errors.reduce((pre, cur) => pre || !!cur, false);

        return isError ? { status: 'ERROR', error: errors } : { status: 'OK', result: keys };
      } catch (e) {
        logger.error(util.format('%s, %j', REDIS_ERR, e));
        return { status: 'ERROR', error: [e] };
      }
    },
    notify: async ({ creator, entityName, id, commitId, expiryBySec = 86400 }) => {
      const key = `n:${creator}:${entityName}:${id}:${commitId}`;

      if (!key) throw new Error(INVALID_ARG);

      // notification flag -- 1: unread; 0: read
      // in future, it may replace with a richer notification
      try {
        await client.redis.set(key, 1, 'EX', expiryBySec);
        return { status: 'OK' };
      } catch (e) {
        logger.error(util.format('%s, %j', REDIS_ERR, e));
        return { status: 'ERROR', error: [e] };
      }
    },
    getNotification: async ({ creator, entityName, id, commitId }) => {
      const key = getPatternOrSingleKey({ creator, entityName, id, commitId });

      if (!key) throw new Error(INVALID_ARG);

      try {
        // getset will turn the notification flag off, after reading
        const result = await client.redis.getset(key, '0').then((value) => ({ [key]: value }));
        return { status: 'OK', result };
      } catch (e) {
        logger.error(util.format('%s, %j', REDIS_ERR, e));
        return { status: 'ERROR', error: [e] };
      }
    },
    getNotificationsByFields: async ({ creator, entityName, id }) => {
      const pattern = getPatternOrSingleKey({ creator, entityName, id });

      if (!pattern) throw new Error(INVALID_ARG);

      try {
        const result = {};
        const [_, keys] = await client.redis.scan(0, 'MATCH', pattern);
        if (keys?.length === 0) return { status: 'OK', result: [] };

        const [errors, items]: [error: Error[], items: any[]] = await pipelineExec(
          client,
          'GET',
          pattern
        ).then((data) => [data.map(([e, _]) => e), data.map(([_, item]) => item)]);

        if (items?.length !== keys?.length)
          return { status: 'ERROR', error: [new Error('unexpected error')] };

        for (const index in keys) {
          // https://eslint.org/docs/rules/guard-for-in
          if (Object.prototype.hasOwnProperty.call(keys, index)) result[keys[index]] = items[index];
        }

        const isError = errors.reduce((pre, cur) => pre || !!cur, false);

        return isError ? { status: 'ERROR', error: errors } : { status: 'OK', result };
      } catch (e) {
        logger.error(util.format('%s, %j', REDIS_ERR, e));
        return { status: 'ERROR', error: [e] };
      }
    },
  };
};

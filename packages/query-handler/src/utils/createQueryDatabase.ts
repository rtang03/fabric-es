import util from 'util';
import { Commit } from '@fabric-es/fabric-cqrs';
import type { Redis } from 'ioredis';
import drop from 'lodash/drop';
import flatten from 'lodash/flatten';
import isEqual from 'lodash/isEqual';
import type { QueryDatabase } from '../types';
import { getLogger } from './getLogger';
import { fromArraysToCommitRecords, fullTextSearchAdd, pipelineExecute } from '.';

export const createQueryDatabase: (redis: Redis) => QueryDatabase = (redis) => {
  const logger = getLogger({ name: '[query-handler] createQueryDatabase.js' });
  const countNonNull = (deletedItems: number[][]) =>
    flatten(deletedItems)
      .filter((item) => !!item)
      .reduce((prev, curr) => prev + curr, 0);

  return {
    deleteByEntityId: async ({ entityName, id }) => {
      const pattern = `${entityName}::${id}::*`;
      let result: number;

      try {
        const redisResult = await pipelineExecute(redis, 'DEL', pattern);
        result = countNonNull(redisResult);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }
      return {
        status: 'OK',
        message: `${entityName}::${id}: ${result} records are removed`,
        result,
      };
    },
    deleteByEntityName: async ({ entityName }) => {
      const pattern = `${entityName}::*`;
      let result: number;

      try {
        const redisResult = await pipelineExecute(redis, 'DEL', pattern);
        result = countNonNull(redisResult);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }
      return {
        status: 'OK',
        message: `${entityName}: ${result} is removed`,
        result,
      };
    },
    queryByEntityId: async ({ entityName, id }) => {
      const pattern = `${entityName}::${id}::*`;
      let commitArrays: string[][];
      let result: Record<string, Commit>;

      try {
        commitArrays = await pipelineExecute(redis, 'GET', pattern);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }

      if (commitArrays.length === 0)
        return { status: 'OK', message: `queryByEntityId: 0 record is returned`, result: {} };

      try {
        result = fromArraysToCommitRecords(commitArrays);
      } catch (e) {
        logger.error(util.format('fail to parse json, %j', e));
        throw e;
      }

      return {
        status: 'OK',
        message: `${Object.keys(result).length} records are returned`,
        result,
      };
    },
    queryByEntityName: async ({ entityName }) => {
      const pattern = `${entityName}::*`;
      let commitArrays: string[][];
      let result: Record<string, Commit>;

      try {
        commitArrays = await pipelineExecute(redis, 'GET', pattern);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }

      try {
        result = fromArraysToCommitRecords(commitArrays);
      } catch (e) {
        logger.error(util.format('fail to parse json, %j', e));
        throw e;
      }
      return {
        status: 'OK',
        message: `${Object.keys(result).length} records are returned`,
        result,
      };
    },
    merge: async ({ commit }) => {
      const redisKey = `${commit.entityName}::${commit.entityId}::${commit.commitId}`;

      let status;

      try {
        status = await redis.set(redisKey, JSON.stringify(commit));

        // secondary index
        await fullTextSearchAdd(redisKey, commit, redis);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }
      return { status, message: `${redisKey} merged successfully`, result: [redisKey] };
    },
    mergeBatch: async ({ entityName, commits }) => {
      const map: Record<string, string> = {};
      const entityNameKeys = [];
      let status;

      if (isEqual(commits, {}))
        return {
          status: 'OK',
          message: 'no commit record exists',
          result: [],
        };

      try {
        for await (const [commitId, commit] of Object.entries(commits)) {
          // construct primary key-value map
          const redisKey = `${entityName}::${commit.entityId}::${commitId}`;
          map[redisKey] = JSON.stringify(commit);
          entityNameKeys.push(redisKey);

          // secondary index
          await fullTextSearchAdd(redisKey, commit, redis);
        }
        status = await redis.mset(map);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }

      logger.info(`entityName: ${entityName} mergBatch: ${status}`);

      return {
        status,
        message: `${entityNameKeys.length} records merged successfully`,
        result: entityNameKeys,
      };
    },
    fullTextSearch: async ({ query }) => {
      const searchResultParser = (searchedResult: any[]) => {
        const count = searchedResult[0];
        const data = drop(searchedResult);
        const result = {};
        for (let i = 0; i < count; i++) {
          const len = data[i * 2 + 1].length / 2;
          const obj = {};
          for (let j = 0; j < len; j++) {
            obj[data[i * 2 + 1][j * 2]] = data[i * 2 + 1][j * 2 + 1];
          }
          result[data[i * 2]] = obj;
        }
        // return records of indexed document
        return result;
      };

      let result = {};
      let ftsResult;
      try {
        ftsResult = await redis.send_command('FT.SEARCH', ['cidx', query, 'SORTBY', 'key', 'ASC']);
        result = {};
        if (ftsResult[0] === 0)
          return {
            status: 'OK',
            message: 'full text search: 0 record returned',
            result,
          };
        for await (const [_, { key }] of Object.entries<any>(searchResultParser(ftsResult))) {
          result[key] = JSON.parse(await redis.get(key));
        }
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }
      return {
        status: 'OK',
        message: `full text search: ${ftsResult[0]} record(s) returned`,
        result,
      };
    },
  };
};

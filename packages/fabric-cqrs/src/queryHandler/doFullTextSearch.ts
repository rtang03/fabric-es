import util from 'util';
import type { Redis } from 'ioredis';
import drop from 'lodash/drop';
import type { QueryDatabaseResponse } from '../types';

export const doFullTextSearch: <T = any>(
  query: string,
  option: { index: string; redis: Redis; logger }
) => Promise<QueryDatabaseResponse<Record<string, T>>> = async <TEntity>(
  query,
  { index, redis, logger }
) => {
  const searchResultParser = (searchedResult: any[]) => {
    const data = drop(searchedResult);
    const count = data.length / 2;
    const result = {};
    for (let i = 0; i < count; i++) {
      // this avoids un-expected null record from redis search
      if (data[i * 2 + 1]) {
        const numberOfFields = data[i * 2 + 1].length / 2;
        const obj = {};
        for (let j = 0; j < numberOfFields; j++) {
          obj[data[i * 2 + 1][j * 2]] = data[i * 2 + 1][j * 2 + 1];
        }
        result[data[i * 2]] = obj;
      }
    }
    return result;
  };
  let result: Record<string, TEntity>;
  let ftsResult;
  try {
    ftsResult = await redis.send_command('FT.SEARCH', [index, query, 'SORTBY', 'key', 'ASC']);
    result = {};
    if (ftsResult[0] === 0)
      return {
        status: 'OK',
        message: 'full text search: 0 record returned',
        result: null,
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
};

import util from 'util';
import { Redis } from 'ioredis';
import isNumber from 'lodash/isNumber';
import { QueryDatabaseResponse } from '../types';

export const sizeOfSearchResult: (
  query: string[],
  option: { index: string; redis: Redis; logger }
) => Promise<QueryDatabaseResponse<number>> = async (query, { index, redis, logger }) => {
  let result: number;

  try {
    result = await redis.send_command('FT.SEARCH', [index, ...query]);
  } catch (e) {
    logger.error(util.format('unknown redis error, %j', e));
    throw e;
  }

  return isNumber(result?.[0])
    ? {
        status: 'OK',
        message: `query: ${query} has ${result[0]} record(s)`,
        result: result[0],
      }
    : {
        status: 'ERROR',
        message: 'unexpected response',
        result,
      };
};

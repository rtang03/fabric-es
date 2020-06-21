import util from 'util';
import { Redis } from 'ioredis';
import { QueryDatabaseResponse } from '../types';

export const sizeOfSearchResult: (
  query: string[],
  option: { index: string; redis: Redis; logger }
) => Promise<QueryDatabaseResponse<number>> = async (query, { index, redis, logger }) => {
  let result: number;

  try {
    result = await redis.send_command('FT.SEARCH', [index, ...query, 'LIMIT', '0', '0']);
  } catch (e) {
    logger.error(util.format('unknown redis error, %j', e));
    throw e;
  }
  return {
    status: 'OK',
    message: `query: ${query} has ${result} record(s)`,
    result,
  };
};

import util from 'util';
import type { RedisRepository } from '@fabric-es/fabric-cqrs';
import type { Logger } from 'winston';

/**
 * @about drop and rebuild cidx and eidx
 * @params publisher
 * @params logger
 */
export const rebuildIndex: (redisRepo: RedisRepository, logger: Logger) => Promise<any> = async (
  redisRepo,
  logger
) => {
  const index = redisRepo.getIndexName();

  await redisRepo
    .dropIndex(true)
    .then((result) => logger.info(`${index} dropped: ${result}`))
    .catch((error) => logger.warn(util.format('fail to drop %s, %j', index, error)));

  return redisRepo.createIndex().then((result) => {
    logger.info(`${index} created: ${result}`);
    return result;
  });
};

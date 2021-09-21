import util from 'util';
import Debug from 'debug';
import { Redisearch } from 'redis-modules-sdk';
import { getLogger } from '../utils';

const debug = Debug('queryHandler:createRedisRepository:pipelineExec');

/**
 * Batch execution of redis command
 * @ignore
 */
export const pipelineExec: <TResult = any>(
  client: Redisearch,
  action: 'HGETALL' | 'DELETE' | 'GET',
  pattern: string,
  keys?: string[]
) => Promise<[Error, TResult][]> = async (client, action, pattern, keys) => {
  const logger = getLogger({ name: '[query-handler] pipelineExec.js', target: 'console' });
  let pong: string;

  try {
    debug('ping: %s', action);
    debug('ping: %pattern', pattern);
    debug('redis-options, %O', client.redis.options);

    pong = await client.redis.send_command('ping');

    debug('ping redis-cli: %O', pong);

    logger.info(`ping redis-cli: ${pong}`);
  } catch (err) {
    logger.error(util.format('fail to ping Redis, %j', err));
  }

  if (pong?.toLowerCase() !== 'pong') throw new Error('fail to PING redis');

  // scan return [string, string[]] , i.e. [cursor, keys[]]
  // TODO: Need double check what is right number of COUNT. 100,000 is the same limit as Fabric getQuery
  const _keys = keys || (await client.redis.scan(0, 'MATCH', pattern, 'COUNT', 100000))[1];

  if (!_keys) throw new Error('keys not found');

  const pipeline = client.redis.pipeline();

  ({
    DELETE: () => _keys.forEach((key) => pipeline.del(key)),
    HGETALL: () => _keys.forEach((key) => pipeline.hgetall(key)),
    GET: () => _keys.forEach((key) => pipeline.get(key)),
  }[action]());

  return pipeline.exec();
};

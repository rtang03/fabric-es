import { QueryHandler } from '@fabric-es/fabric-cqrs';
import type { Logger } from 'winston';

/**
 * @about reconcile on chain data from Fabric to redis
 * @params entityNames
 * @params queryHandler
 * @params logger
 */
export const reconcile = async (entityNames, queryHandler: QueryHandler, logger: Logger) => {
  for await (const entityName of entityNames) {
    await queryHandler
      .query_deleteCommitByEntityName(entityName)()
      .then(({ data, status }) => logger.debug(`status: ${status}; ${data} record(s) deleted`));

    await queryHandler.reconcile()({ entityName });
  }
};

import { QueryHandler } from '@fabric-es/fabric-cqrs';
import type { Logger } from 'winston';

export const reconcile = async (entityNames, queryHandler: QueryHandler, logger: Logger) => {
  for await (const entityName of entityNames) {
    await queryHandler
      .query_deleteCommitByEntityName(entityName)()
      .then(({ data, status }) => logger.info(`status: ${status}; ${data} record(s) deleted`));

    await queryHandler.reconcile()({ entityName });
  }
};

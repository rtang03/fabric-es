import { getStore } from '../store';
import type { ReducerCallback, Repository, RepoOption, EntityType } from '../types';
import { getReducer } from '../types';
import {
  getLogger,
  commandCreate,
  commandDeleteByEntityId,
  commandGetByEntityName,
  queryGetEntityByEntityName,
  queryGetCommitByEntityId,
  queryDeleteCommitByEntityId,
  queryDeleteCommitByEntityName,
  commandGetById,
  commandGetByEntityIdCommitId,
  queryFullTextSearch,
} from '../utils';

/**
 * @about create repository for public / onchain data
 * @example
 * [repo.unit-test.ts](https://github.com/rtang03/fabric-es/blob/master/packages/fabric-cqrs/src/repository/__tests__/repo.unit-test.ts)
 * ```typescript
 * const repo = createRepository<Counter, CounterEvent>(
 *     entityName,
 *     reducer,
 *     {
 *         queryDatabase,
 *         gateway,
 *         network,
 *         channelName,
 *         connectionProfile,
 *         wallet,
 *         logger,
 *   });
 * ```
 * @typeParams TEntity
 * @typeParams TEvent
 * @params entityName
 * @params reducer [[Reducer]]
 * @params option [[RepoOption]]
 */
export const createRepository: <TEntity = any, TOutputEntity = any, TEvent = any>(
  entity: EntityType<TEntity>,
  callback: ReducerCallback<TEntity, TEvent>,
  option: RepoOption
) => Repository<TEntity, TOutputEntity, TEvent> = <TEntity, TEvent>(entity, callback, option) => {
  const entityName = entity.entityName;
  const reducer = getReducer<TEntity, TEvent>(callback);
  const logger = option?.logger || getLogger({ name: '[fabric-cqrs] createRepository.js' });
  const { queryDatabase, gateway, network, channelName, connectionProfile, wallet } = option;
  const store = getStore({
    queryDatabase,
    network,
    gateway,
    reducers: { [entityName]: reducer },
    logger,
  });
  const commandOption = {
    logger,
    wallet,
    store,
    connectionProfile,
    channelName,
  };
  const queryOption = { logger, store };

  return {
    command_deleteByEntityId: commandDeleteByEntityId(entityName, false, commandOption),
    command_getByEntityName: commandGetByEntityName(entityName, false, commandOption),
    command_getByEntityIdCommitId: commandGetByEntityIdCommitId(entityName, false, commandOption),
    create: commandCreate(entityName, false, commandOption),
    disconnect: () => gateway.disconnect(),
    fullTextSearchCommit: async ({ query, param, cursor, pagesize }) =>
      queryFullTextSearch({ store, logger, query, param, cursor, pagesize }),
    fullTextSearchEntity: async ({ query, param, cursor, pagesize, entityName }) =>
      queryFullTextSearch({ store, logger, query, param, cursor, pagesize, entityName }),
    getByEntityName: queryGetEntityByEntityName(entityName, reducer, queryOption),
    getById: commandGetById(entityName, reducer, false, commandOption),
    getCommitById: queryGetCommitByEntityId(entityName, queryOption),
    getEntityName: () => entityName,
    query_deleteCommitByEntityId: queryDeleteCommitByEntityId(entityName, queryOption),
    query_deleteCommitByEntityName: queryDeleteCommitByEntityName(entityName, queryOption),
  };
};

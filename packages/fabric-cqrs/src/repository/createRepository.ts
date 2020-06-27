import { getStore } from '../store';
import { Reducer, Repository, RepoOption, BaseEntity, BaseEvent } from '../types';
import {
  getLogger,
  commandCreate,
  commandDeleteByEntityId,
  commandGetByEntityName,
  queryGetEntityByEntityName,
  queryGetCommitByEntityId,
  queryDeleteCommitByEntityId,
  queryDeleteCommitByEntityName,
  queryGetById,
  commandGetByEntityIdCommitId,
  queryFind,
  metaGetEntityByEntNameEntId,
  getPaginated,
  queryGetPaginatedEntityById,
} from '../utils';

export const createRepository: <TEntity extends BaseEntity, TEvent extends BaseEvent>(
  entityName: string,
  reducer: Reducer,
  option: RepoOption
) => Repository<TEntity, TEvent> = <TEntity, TEvent>(entityName, reducer, option) => {
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
    create: commandCreate<TEvent>(entityName, false, commandOption),
    command_deleteByEntityId: commandDeleteByEntityId(entityName, false, commandOption),
    command_getByEntityName: commandGetByEntityName(entityName, false, commandOption),
    command_getByEntityIdCommitId: commandGetByEntityIdCommitId(entityName, false, commandOption),
    getById: queryGetById<TEntity, TEvent>(entityName, reducer, false, commandOption),
    getByEntityName: queryGetEntityByEntityName<TEntity>(entityName, reducer, queryOption),
    getCommitById: queryGetCommitByEntityId(entityName, queryOption),
    query_deleteCommitByEntityId: queryDeleteCommitByEntityId(entityName, queryOption),
    query_deleteCommitByEntityName: queryDeleteCommitByEntityName(entityName, queryOption),
    find: queryFind<TEntity>(entityName, queryOption),
    getPaginatedEntityById: async (criteria, id) => {
      !criteria.cursor && (criteria.cursor = 0);
      !criteria.pagesize && (criteria.pagesize = 10);

      const total = await queryGetPaginatedEntityById<number>(
        entityName,
        id,
        queryOption
      )({ ...criteria, cursor: 0, pagesize: 0 });

      const paginated = await queryGetPaginatedEntityById<TEntity[]>(
        entityName,
        id,
        queryOption
      )(criteria);

      return total.status !== 'OK'
        ? { error: total.error, message: total.message }
        : paginated.status !== 'OK'
        ? { error: paginated.error, message: paginated.message }
        : { data: getPaginated<TEntity>(paginated.data, total.data, criteria.cursor) };
    },
    getEntityName: () => entityName,
    disconnect: () => gateway.disconnect(),
  };
};
